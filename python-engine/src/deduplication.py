import numpy as np
from shapely.geometry import Polygon
import cv2

def mask_iou(poly1, poly2):
    """
    Computes Intersection Over Union absolutely strictly using Shapely Geometries rather than fuzzy OpenCV BBoxes.
    Requires (N, 2) numpy point formats.
    """
    try:
        if len(poly1) < 3 or len(poly2) < 3:
            return 0.0
            
        p1 = Polygon(poly1)
        p2 = Polygon(poly2)
        
        if not p1.is_valid:
            p1 = p1.buffer(0)
        if not p2.is_valid:
            p2 = p2.buffer(0)
            
        if not p1.intersects(p2):
            return 0.0
            
        intersection = p1.intersection(p2).area
        union = p1.union(p2).area
        
        return intersection / union if union > 0 else 0.0
    except Exception:
        return 0.0

def calculate_mask_area_opencv(polygon_points):
    """
    Provides deterministic exact sub-pixel geometric area.
    """
    if len(polygon_points) < 3:
        return 0.0
    return float(cv2.contourArea(np.array(polygon_points, dtype=np.float32)))

def remove_duplicates_via_mask_iou(detections, iou_threshold=0.5):
    """
    Resolves tile boundary duplication strictly using Polygon overlap volumes.
    Always maintains the geometry possessing higher pyTorch detection confidence.
    
    Args:
        detections (list): [{ "polygon": np.array, "confidence": float }, ...]
        iou_threshold (float): Threshold above which two polygons are considered the identical physical panel.
        
    Returns:
        list: Deduped panel list retaining original schema.
    """
    if not detections:
        return []
        
    # Sort rigorously by confidence descending layout so top elements absorb bottom
    detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
    keep = []
    
    for det in detections:
        is_duplicate = False
        polyA = det['polygon']
        
        for k_det in keep:
            polyB = k_det['polygon']
            iou = mask_iou(polyA, polyB)
            
            if iou > iou_threshold:
                is_duplicate = True
                break
                
        if not is_duplicate:
            keep.append(det)
            
    return keep
