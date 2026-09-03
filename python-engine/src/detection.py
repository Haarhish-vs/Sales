import os
from ultralytics import YOLO

class PanelDetector:
    def __init__(self, model_path="models/solar_panel_best.pt", conf_thresh=0.5, target_class=0, device="cpu"):
        """
        Initializes the YOLO Instance Segmentation engine strictly locked to custom PyTorch weights.
        """
        self.conf_thresh = conf_thresh
        self.target_class = target_class
        self.device = device
        
        print(f"[PanelDetector] Initializing with strict model policy: {model_path}")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"\n[CRITICAL ERROR] Custom Production Model Not Found: {model_path}\n"
                f"You MUST provide a custom-trained solar-panel '.pt' instance segmentation file.\n"
                f"Please place your file at: {model_path}\n"
                f"Fallbacks, generic Coco models, and automatic HuggingFace downloads have been explicitly disabled for structural integrity."
            )
        
        self.model = YOLO(model_path)
    
    def infer_tile(self, image_np, x_offset, y_offset):
        """
        Runs localized inference on an extracted Tile RAM array.
        Extracts polygons (masks) out of PyTorch tensors and shifts them natively against the global array bounds.
        
        Returns:
            list: List of dictionaries representing globalized detected structures.
        """
        results = self.model(image_np, conf=self.conf_thresh, device=self.device, verbose=False)
        detected_panels = []
        
        for r in results:
            if r.masks is None or r.masks.xy is None:
                continue

            boxes = r.boxes
            masks_xy = r.masks.xy
            
            for i, mask in enumerate(masks_xy):
                cls_id = int(boxes.cls[i])
                if cls_id != self.target_class:
                    continue
                
                conf = float(boxes.conf[i])
                
                # Natively shift the floating polygon boundaries from Tile-Local to Global-World coordinates
                if len(mask) == 0:
                    continue
                    
                global_polygon = mask.copy()
                global_polygon[:, 0] += x_offset
                global_polygon[:, 1] += y_offset
                
                detected_panels.append({
                    "polygon": global_polygon,
                    "confidence": conf
                })
                
        return detected_panels
