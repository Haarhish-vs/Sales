import sys
import cv2
import numpy as np
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import json
import os
import random

def analyze_image(image_path, output_dir):
    # 1. Load Image
    img = cv2.imread(image_path)
    if img is None:
        print(json.dumps({"error": "Failed to load image"}))
        sys.exit(1)
        
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Simulated Structural Panel segmentation (finding ALL panels)
    # Using adaptive threshold to find structural boundaries across different lightings
    blurred = cv2.GaussianBlur(img_gray, (7, 7), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 3)
    
    # Dilate to close panel borders
    kernel = np.ones((5,5), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    anomalies = []
    # 3. Process Contours (Solar Panels / Hotspots)
    import uuid
    for i, cnt in enumerate(contours):
        # Filter small noise
        if cv2.contourArea(cnt) < 150: # Increased minimum area to filter noise
            continue
            
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Determine mean pixel brightness inside the panel boundary
        mask = np.zeros(img_gray.shape, np.uint8)
        cv2.drawContours(mask, [cnt], 0, 255, -1)
        mean_intensity = cv2.mean(img_gray, mask=mask)[0]
        
        # Calculate dynamic temperature based on raw pixel brightness + slight variation
        temp_diff = (mean_intensity / 255.0) * 45.0 + random.uniform(0, 5) 
        status = "Hotspot" if temp_diff > 25.0 else "Normal"
        
        # Determine panel coordinates
        row = (y // 150) + 1
        col = (x // 150) + 1
        lat = 34.0522 + (y * 0.00001)
        long_val = -118.2437 + (x * 0.00001)
        
        # Crop Image
        crop_img = img[y:y+h, x:x+w]
        crop_path = os.path.join(output_dir, f"panel_{i}_{uuid.uuid4().hex[:6]}.png")
        if crop_img.size > 0:
            cv2.imwrite(crop_path, crop_img)
            
        anomalies.append({
            "id": f"Panel-{i+1}",
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "row": row,
            "col": col,
            "lat": round(lat, 5),
            "long": round(long_val, 5),
            "temp_difference": round(temp_diff, 1),
            "status": status,
            "crop_path": crop_path
        })
        
        if status == "Hotspot":
            # Draw red box for anomaly
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.putText(img, f"{temp_diff:.1f}C", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        else:
            # Draw green box for normal
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 1)

            
    # 4. Save Annotated Image
    annotated_img_path = os.path.join(output_dir, "annotated_result.png")
    cv2.imwrite(annotated_img_path, img)
    
    # 5. Generate PDF Report
    pdf_path = os.path.join(output_dir, "thermal_report.pdf")
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Solar Farm Thermal Analysis Report")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Total Panels Detected: {len(anomalies)}")
    
    # Draw scaled annotated image on PDF
    try:
        c.drawImage(annotated_img_path, 50, height - 400, width=500, preserveAspectRatio=True)
    except:
        pass
        
    c.drawString(50, height - 430, "Panel Details:")
    y_pos = height - 460
    
    # Show all panels
    for panel in anomalies:
        if y_pos < 120:
            c.showPage()
            y_pos = height - 60
            
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y_pos, f"{panel['id']} - Temp: +{panel['temp_difference']} °C ({panel['status']})")
        
        c.setFont("Helvetica", 10)
        c.drawString(50, y_pos - 20, f"Location: Row {panel['row']}, Column {panel['col']}")
        c.drawString(50, y_pos - 35, f"Coordinates: Lat {panel['lat']}, Long {panel['long']}")
        
        try:
            # Draw small crop image alongside text
            if os.path.exists(panel['crop_path']):
                c.drawImage(panel['crop_path'], 380, y_pos - 50, width=100, height=60, preserveAspectRatio=True)
        except Exception:
            pass
            
        y_pos -= 80 # spacing for the next panel entry
            
    c.save()
    
    # Return JSON to Node.js
    result = {
        "anomalies_count": len(anomalies),
        "anomalies": anomalies,
        "annotated_image": annotated_img_path,
        "pdf_report": pdf_path
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: analyze.py <image_path> <output_dir>"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    output_dir = sys.argv[2]
    analyze_image(image_path, output_dir)
