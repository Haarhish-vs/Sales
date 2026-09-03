import os
import rasterio
import numpy as np

from src.tiling import generate_tiles
from src.geospatial import get_crs_transformer, pixel_to_latlon, extract_polygon_bounds
from src.detection import PanelDetector
from src.deduplication import remove_duplicates_via_mask_iou, calculate_mask_area_opencv
from src.cropping import crop_panel_geotiff
from src.thermal import extract_thermal_stats
from src.reporting import generate_reports, draw_annotated_overview

class SolarPipeline:
    def __init__(self, config):
        """
        Coordinates decoupled strict modules into a single processing memory state matrix.
        """
        self.config = config
        self.detector = PanelDetector(model_path=config['model_path'], conf_thresh=config['conf_thresh'])
        
        self.panels_dir = os.path.join(config['output_dir'], "panels")
        os.makedirs(self.panels_dir, exist_ok=True)
        os.makedirs(os.path.join(config['output_dir'], "metadata"), exist_ok=True)

    def format_georeferenced_panel_array(self, image_np):
        """Standardizes non-uniform arrays sequentially so PyTorch inference does not overflow."""
        if image_np.ndim == 2:
            return np.stack((image_np,)*3, axis=-1)
        elif image_np.ndim == 3:
            if image_np.shape[0] >= 3:
                img = np.transpose(image_np[:3], (1, 2, 0))
                # YOLOv8 expects uint8, so we auto-cast native unscaled 16bit for inference ONLY (Crop preserves 16bit)
                if img.dtype != np.uint8:
                    img = ((img - img.min()) / (img.max() - img.min() + 1e-5) * 255).astype(np.uint8)
                return img
            else:
                return np.stack((image_np[0],)*3, axis=-1)
        return image_np

    def run(self):
        img_path = self.config['image_path']
        print(f"\n[Pipeline] Booting strict analysis engine on payload: {img_path}")
        
        global_detections = []
        
        with rasterio.open(img_path) as src:
            w, h = src.width, src.height
            transform = src.transform
            transformer = get_crs_transformer(src.crs)
            
            tiles = list(generate_tiles(image_width=w, image_height=h, 
                                        tile_size=self.config['tile_size'], 
                                        overlap=self.config['overlap']))
                                        
            print(f"[Pipeline] Matrix subdivided geometrically into {len(tiles)} windows.")
            
            for win, (x_off, y_off) in tiles:
                tile_arr = src.read(window=win)
                # Pad broken edges symmetrically if needed
                if tile_arr.shape[-1] == 0 or tile_arr.shape[-2] == 0:
                    continue
                infer_ready_arr = self.format_georeferenced_panel_array(tile_arr)
                detections = self.detector.infer_tile(infer_ready_arr, x_off, y_off)
                global_detections.extend(detections)
                
            print(f"[Pipeline] Base inferences concluded. Absolute Objects Generated: {len(global_detections)}")
            
            # Mathematical Global Deduplication
            filtered_detections = remove_duplicates_via_mask_iou(global_detections, self.config.get('iou_thresh', 0.4))
            print(f"[Pipeline] Duplicates nullified mathematically. Final Registered Panel Database: {len(filtered_detections)}")

            # Deterministic sorting topology: Sort Top-to-Bottom, Left-to-Right
            filtered_detections.sort(key=lambda d: (extract_polygon_bounds(d['polygon'])[1] // 100, extract_polygon_bounds(d['polygon'])[0]))

            final_registry = []
            print("[Pipeline] Starting Radiometric Data-Extraction Pipeline...")
            
            for idx, det in enumerate(filtered_detections):
                panel_id = f"P{str(idx + 1).zfill(3)}"
                poly = det['polygon']
                
                min_x, min_y, width, height = extract_polygon_bounds(poly)
                cx = min_x + (width / 2)
                cy = min_y + (height / 2)
                lat, lon = pixel_to_latlon(transform, transformer, cx, cy)
                
                # Geotiff Extraction preserving 100% radiometric fidelity
                output_panel_path = os.path.join(self.panels_dir, f"{panel_id}.tif")
                raw_matrix = crop_panel_geotiff(src, min_x, min_y, width, height, output_panel_path)
                
                # Thermal extraction against actual geometry slice
                thermal_stats = extract_thermal_stats(raw_matrix, self.config.get('c2f', False))
                
                mask_area_px = calculate_mask_area_opencv(poly)
                bbox_area_px = width * height
                
                reg = {
                    "Panel_ID": panel_id,
                    "Confidence": round(det['confidence'], 3),
                    "Class": "Panel",
                    "BBox_X": int(min_x),
                    "BBox_Y": int(min_y),
                    "BBox_W": int(width),
                    "BBox_H": int(height),
                    "Center_X_px": int(cx),
                    "Center_Y_px": int(cy),
                    "Latitude": round(lat, 6) if lat else None,
                    "Longitude": round(lon, 6) if lon else None,
                    "Mask_Area_px": round(mask_area_px, 1),
                    "BBox_Area_px": round(bbox_area_px, 1),
                    "Mask_BBox_Ratio": round(mask_area_px / bbox_area_px, 2) if bbox_area_px > 0 else 0,
                    "Polygon_Pts": poly.tolist()
                }
                reg.update(thermal_stats)
                final_registry.append(reg)
            
            # Overview plotting
            print("[Pipeline] Drawing Annotated Summary Matrices...")
            try:
                # Downsample large images for plotting only physically
                scale = min(1.0, 3000 / max(w, h))
                overview_arr = src.read(out_shape=(src.count, int(h * scale), int(w * scale)))
                
                # Rescale pure display polygons dynamically
                scaled_registry = []
                import copy
                for r in final_registry:
                    r2 = copy.deepcopy(r)
                    r2['Polygon_Pts'] = (np.array(r['Polygon_Pts']) * scale).tolist()
                    r2['Center_X_px'] *= scale
                    r2['Center_Y_px'] *= scale
                    scaled_registry.append(r2)
                    
                draw_annotated_overview(overview_arr, scaled_registry, self.config['output_dir'])
            except Exception as e:
                print(f"[Pipeline] Overview annotation drawing aborted due to resolution constraints: {e}")

            generate_reports(final_registry, self.config['output_dir'])
            print("\n[SUCCESS] Unified Local Engine Protocol Terminated Flawlessly.")
