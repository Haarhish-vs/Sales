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
    
    # 2. Simulated Thermal thresholding (finding bright spots)
    _, thresh = cv2.threshold(img_gray, 200, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    anomalies = []
    # 3. Process Contours (Solar Panels / Hotspots)
    for i, cnt in enumerate(contours):
        # Filter small noise
        if cv2.contourArea(cnt) < 50:
            continue
            
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Simulated temperature anomaly
        temp_diff = random.uniform(5.0, 45.0) 
        status = "Hotspot" if temp_diff > 15.0 else "Normal"
        
        if status == "Hotspot":
            # Draw red box for anomaly
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.putText(img, f"{temp_diff:.1f}C", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            
            anomalies.append({
                "id": f"Panel-{i+1}",
                "x": x,
                "y": y,
                "temp_difference": round(temp_diff, 1),
                "status": status
            })
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
    c.drawString(50, height - 80, f"Total Anomalies Detected: {len(anomalies)}")
    
    # Draw scaled annotated image on PDF
    try:
        c.drawImage(annotated_img_path, 50, height - 400, width=500, preserveAspectRatio=True)
    except:
        pass
        
    c.drawString(50, height - 430, "Anomaly Details:")
    y_pos = height - 460
    for anomaly in sorted(anomalies, key=lambda a: a['temp_difference'], reverse=True)[:10]: # Top 10
        c.drawString(50, y_pos, f"{anomaly['id']}: +{anomaly['temp_difference']} °C at (X:{anomaly['x']}, Y:{anomaly['y']})")
        y_pos -= 20
        if y_pos < 50:
            c.showPage()
            y_pos = height - 50
            
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
