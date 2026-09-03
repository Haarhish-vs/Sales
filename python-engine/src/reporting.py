import pandas as pd
import os
import cv2
import numpy as np

def generate_reports(panel_registry, output_dir):
    """
    Spawns CSV and XLSX analytical reports spanning the absolute panel registry database.
    """
    reports_dir = os.path.join(output_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    if not panel_registry:
        print("[Reporting] Registry completely empty. Generating blank datasets.")
        df = pd.DataFrame()
    else:
        df = pd.DataFrame(panel_registry)
        
    csv_path = os.path.join(reports_dir, "results.csv")
    xlsx_path = os.path.join(reports_dir, "results.xlsx")
    
    df.to_csv(csv_path, index=False)
    try:
        df.to_excel(xlsx_path, index=False)
    except Exception as e:
        print(f"Failed drawing .xlsx file (likely missing openpyxl). Saving CSV exclusively. Error: {e}")
        
    print(f"Saved primary data reports to:\n - {csv_path}\n - {xlsx_path}")
    return csv_path

def draw_annotated_overview(source_image_arr, panel_registry, output_dir):
    """
    Visualizes the entire global mathematical vector register against the raw source pixel matrix natively.
    """
    overview_dir = os.path.join(output_dir, "overview")
    os.makedirs(overview_dir, exist_ok=True)
    
    if source_image_arr is None:
        return None
        
    try:
        if source_image_arr.shape[0] == 1:
            display_img = cv2.cvtColor(source_image_arr[0], cv2.COLOR_GRAY2BGR)
        else:
            display_img = np.transpose(source_image_arr[:3], (1, 2, 0))
            if display_img.dtype != np.uint8:
                display_img = cv2.normalize(display_img, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    except Exception as e:
        print(f"Display image extraction crashed: {e}")
        return None

    overlay = display_img.copy()

    for p in panel_registry:
        poly_pts = p.get('Polygon_Pts')
        if poly_pts is not None and len(poly_pts) > 0:
            # Draw highly visible transparent geometric overlays
            poly_drawn = np.array(poly_pts, dtype=np.int32)
            cv2.fillPoly(overlay, [poly_drawn], (0, 0, 255))
            
            # Print precise identifiers mathematically centered inside the polygon bounds
            cx, cy = p.get('Center_X_px', 0), p.get('Center_Y_px', 0)
            cv2.putText(display_img, p['Panel_ID'], (int(cx) - 15, int(cy)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                        
    # Combine transparency
    alpha = 0.4
    display_img = cv2.addWeighted(overlay, alpha, display_img, 1 - alpha, 0)
    
    out_path = os.path.join(overview_dir, "annotated_overview.jpg")
    cv2.imwrite(out_path, cv2.cvtColor(display_img, cv2.COLOR_RGB2BGR) if display_img.shape[2] == 3 else display_img)
    return out_path
