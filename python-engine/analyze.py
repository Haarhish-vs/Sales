import sys
import os
import argparse
import rasterio
from rasterio.windows import Window
import pandas as pd
import numpy as np
import cv2
from ultralytics import YOLO
import json

def calculate_iou(box1, box2):
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2
    
    xi1 = max(x1, x2)
    yi1 = max(y1, y2)
    xi2 = min(x1+w1, x2+w2)
    yi2 = min(y1+h1, y2+h2)
    
    inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
    
    box1_area = w1 * h1
    box2_area = w2 * h2
    union_area = box1_area + box2_area - inter_area
    
    if union_area == 0:
        return 0
    return inter_area / union_area

def global_nms(detections, iou_thresh):
    # Sort detections by confidence
    detections = sorted(detections, key=lambda x: x['conf'], reverse=True)
    keep = []
    
    for det in detections:
        discard = False
        for k in keep:
            iou = calculate_iou(det['bbox'], k['bbox'])
            if iou > iou_thresh:
                discard = True
                break
        if not discard:
            keep.append(det)
    return keep

def analyze_ortho(args):
    os.makedirs(args.output_dir, exist_ok=True)
    
    print(f"Loading YOLO model from {args.model_path}")
    if os.path.exists(args.model_path):
        model = YOLO(args.model_path)
    else:
        # Fallback to pretrained for pure execution test if custom not found yet
        print(f"WARNING: Model {args.model_path} not found. Falling back to yolov8n-seg.pt")
        model = YOLO("yolov8n-seg.pt")
        
    print(f"Opening TIFF image {args.image_path}")
    all_detections = []
    
    with rasterio.open(args.image_path) as src:
        width = src.width
        height = src.height
        transform = src.transform
        has_geo = src.crs is not None
        
        step = int(args.tile_size * (1 - args.overlap))
        
        print(f"Image Size: {width}x{height}. Starting tiled inference...")
        
        for y in range(0, height, step):
            for x in range(0, width, step):
                # Clamp window to boundaries
                w = min(args.tile_size, width - x)
                h = min(args.tile_size, height - y)
                window = Window(x, y, w, h)
                
                # Read RGB bands (assume first 3 bands)
                try:
                    num_bands = min(3, src.count)
                    tile = src.read([1, 2, 3][:num_bands], window=window)
                    # Transpose to HWC
                    tile = np.transpose(tile, (1, 2, 0))
                except Exception as e:
                    print(f"Error reading tile at {x}, {y}: {e}")
                    continue
                
                # Convert to BGR for ultralytics/cv2 if it has 3 channels
                if tile.shape[-1] == 3:
                     tile_bgr = cv2.cvtColor(tile, cv2.COLOR_RGB2BGR)
                else:
                     tile_bgr = tile
                     
                if tile_bgr.size == 0 or np.all(tile_bgr == 0):
                    continue
                    
                # Run YOLO Inference (Segment)
                results = model(tile_bgr, conf=args.conf_thresh, verbose=False)
                
                for r in results:
                    if r.masks is not None:
                        boxes = r.boxes.xyxy.cpu().numpy()
                        confs = r.boxes.conf.cpu().numpy()
                        cls = r.boxes.cls.cpu().numpy()
                        
                        # Process each mask (as polygon coordinates)
                        # We use boxes for the baseline
                        for i, box in enumerate(boxes):
                            x1, y1, x2, y2 = box
                            local_w = x2 - x1
                            local_h = y2 - y1
                            
                            # Transform to global coordinates
                            global_x = int(x + x1)
                            global_y = int(y + y1)
                            global_w = int(local_w)
                            global_h = int(local_h)
                            
                            det = {
                                "bbox": (global_x, global_y, global_w, global_h),
                                "conf": float(confs[i]),
                                "cx": global_x + global_w / 2,
                                "cy": global_y + global_h / 2,
                                "area": global_w * global_h, # BBox area
                            }
                            all_detections.append(det)

        print(f"Total raw detections: {len(all_detections)}. Applying NMS...")
        final_detections = global_nms(all_detections, args.iou_thresh)
        print(f"Valid panels after NMS: {len(final_detections)}")
        
        results_data = []
        
        # We need a downsampled version of the image to draw annotated overview without OOM
        scale_factor = 4000 / max(width, height) # Fit in 4000px
        scale_factor = min(1.0, scale_factor)
        overview_w = int(width * scale_factor)
        overview_h = int(height * scale_factor)
        overview_img = np.zeros((overview_h, overview_w, 3), dtype=np.uint8)
        
        # Iterate and crop pure structures
        for i, det in enumerate(final_detections):
            panel_id = f"P{str(i+1).zfill(3)}"
            global_x, global_y, global_w, global_h = det['bbox']
            
            # Crop Full Res
            crop_window = Window(global_x, global_y, global_w, global_h)
            try:
                crop = src.read([1,2,3][:src.count], window=crop_window)
                if crop.shape[0] == 3:
                     # Transpose to (H, W, C)
                     crop_transposed = np.transpose(crop, (1, 2, 0))
                     # We use cv2 to write a TIF directly, preserving the panel resolution
                     cv2.imwrite(os.path.join(args.output_dir, f"{panel_id}.tif"), cv2.cvtColor(crop_transposed, cv2.COLOR_RGB2BGR))
            except Exception as e:
                print(f"Error cropping {panel_id}: {e}")
                
            # GeoCoordinates
            lat, lon = None, None
            if has_geo:
                lon, lat = transform * (det['cx'], det['cy'])
                
            results_data.append({
                "Panel_ID": panel_id,
                "Confidence": round(det['conf'], 3),
                "BBox_X": global_x,
                "BBox_Y": global_y,
                "BBox_W": global_w,
                "BBox_H": global_h,
                "Center_X": round(det['cx'], 1),
                "Center_Y": round(det['cy'], 1),
                "Area_px": det['area'],
                "Latitude": lat,
                "Longitude": lon
            })
            
            # Draw on overview
            # Scale coordinates
            sx = int(global_x * scale_factor)
            sy = int(global_y * scale_factor)
            sw = int(global_w * scale_factor)
            sh = int(global_h * scale_factor)
            
            # Since overview is empty black right now, let's just make it a mask overlay for now
            cv2.rectangle(overview_img, (sx, sy), (sx + sw, sy + sh), (0, 255, 0), 1)
            cv2.putText(overview_img, panel_id, (sx, max(0, sy-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

        # Build CSV
        df = pd.DataFrame(results_data)
        csv_path = os.path.join(args.output_dir, "results.csv")
        df.to_csv(csv_path, index=False)
        
        cv2.imwrite(os.path.join(args.output_dir, "annotated_overview.jpg"), overview_img)
        
        # Save JSON metadata (matching API expectations conceptually)
        meta = {
            "total_panels": len(final_detections),
            "csv_report": csv_path,
            "models_used": args.model_path 
        }
        with open(os.path.join(args.output_dir, "metadata.json"), "w") as f:
            json.dump(meta, f)
            
        print(f"Processing Complete! Exported to {args.output_dir}")
        print(json.dumps(meta)) # Required for API stdout catching

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image_path", help="Path to input TIFF/GeoTIFF")
    parser.add_argument("output_dir", help="Path to output directory")
    parser.add_argument("--model_path", default="yolov8-solar.pt", help="Path to ultralytics YOLO model")
    parser.add_argument("--tile_size", type=int, default=1024, help="Tile size for inference")
    parser.add_argument("--overlap", type=float, default=0.25, help="Overlap ratio between tiles")
    parser.add_argument("--conf_thresh", type=float, default=0.5, help="Confidence threshold")
    parser.add_argument("--iou_thresh", type=float, default=0.5, help="IOU threshold for global NMS")
    
    args = parser.parse_args()
    analyze_ortho(args)
