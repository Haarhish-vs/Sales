import streamlit as st
import os
import pandas as pd
import glob
from PIL import Image
from src.pipeline import SolarPipeline

st.set_page_config(page_title="Thermal Solar Inspector", layout="wide", page_icon="☀️")

st.title("☀️ Solar-Panel Thermal Orthophoto Analysis")

st.sidebar.header("Configuration")

# 1. Select input TIFF
data_dir = "data/input"
os.makedirs(data_dir, exist_ok=True)
available_tiffs = glob.glob(os.path.join(data_dir, "*.tif")) + glob.glob(os.path.join(data_dir, "*.tiff"))
if not available_tiffs:
    available_tiffs = ["Please drop a .tif into python-engine/data/input/"]

selected_tiff = st.sidebar.selectbox("Original GeoTIFF:", available_tiffs)

# 2. Select strictly tracked model path
model_path = st.sidebar.text_input("Custom Model Path:", "models/solar_panel_best.pt")

if not os.path.exists(model_path):
    st.sidebar.error(f"CRITICAL: {model_path} not found on disk. Strict rules applied.")

# 3. Parameters
conf_thresh = st.sidebar.slider("Confidence Threshold:", 0.1, 1.0, 0.5, 0.05)
iou_thresh = st.sidebar.slider("Deduplication IoU Thresh:", 0.1, 1.0, 0.4, 0.05)
tile_size = st.sidebar.number_input("Tile Size (px):", value=1024, step=256)
overlap = st.sidebar.slider("Tile Overlap:", 0.0, 0.9, 0.25, 0.05)
c2f = st.sidebar.checkbox("Convert Radiometric C to F", value=False)

output_dir = "output"

if st.sidebar.button("🚀 Start Precision Analysis"):
    if not os.path.exists(selected_tiff) or not os.path.exists(model_path):
        st.error("Missing physical files. Refusing to start.")
    else:
        st.info("Initiating strict modular pipeline... Check CLI for realtime logging.")
        config = {
            'image_path': selected_tiff,
            'model_path': model_path,
            'conf_thresh': conf_thresh,
            'iou_thresh': iou_thresh,
            'tile_size': tile_size,
            'overlap': overlap,
            'output_dir': output_dir,
            'c2f': c2f
        }
        
        try:
            pipeline = SolarPipeline(config)
            with st.spinner("Processing massive arrays sequentially..."):
                pipeline.run()
            st.success("✅ Analysis mathematically completed.")
        except Exception as e:
            st.error(f"Engine Exception: {e}")

# Visual Inspection State
st.markdown("---")
st.header("🔍 Visual Review")

csv_path = os.path.join(output_dir, "reports", "results.csv")
annotated_img_path = os.path.join(output_dir, "overview", "annotated_overview.jpg")

col1, col2 = st.columns(2)

with col1:
    if os.path.exists(annotated_img_path):
        st.subheader("Global Poly-Mask Map")
        img = Image.open(annotated_img_path)
        st.image(img, use_column_width=True)

with col2:
    if os.path.exists(csv_path):
        st.subheader("Panel Analytics Database")
        df = pd.read_csv(csv_path)
        st.dataframe(df.style.highlight_max(axis=0))
        
        # Interactive panel inspector
        panel_ids = df['Panel_ID'].tolist()
        if panel_ids:
            selected_panel = st.selectbox("Inspect Individual Panel GeoTiff:", panel_ids)
            
            p_data = df[df['Panel_ID'] == selected_panel].iloc[0]
            st.write(f"**Confidence:** {p_data['Confidence']} | **Status:** {p_data['Status']}")
            st.write(f"**GPS:** {p_data['Latitude']}, {p_data['Longitude']} | **Size:** {p_data['BBox_W']}x{p_data['BBox_H']} px")
            st.write(f"**Hotspot Pixels:** {p_data['Hotspot_Pixels']} ({p_data['Hotspot_Percentage']}%)")
            
            p_img_path = os.path.join(output_dir, "panels", f"{selected_panel}.tif")
            if os.path.exists(p_img_path):
                # Native Tif images cannot be rendered securely on browsers typically without PNG/JPEG conversion
                # But OpenCV/Pillow can read them for Streamlit display!
                try:
                    import cv2
                    import numpy as np
                    raw_tif = cv2.imread(p_img_path, cv2.IMREAD_UNCHANGED)
                    if raw_tif is not None:
                        # Normalize purely for displaying on stream (Data remains 100% absolute on disk)
                        disp_tif = cv2.normalize(raw_tif, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
                        st.image(disp_tif, width=300, caption=f"{selected_panel}.tif Raw Rad-Matrix Cutout")
                except Exception as e:
                    st.write(f"Could not instantly render TIF due to compression types: {e}")
            else:
                st.warning("Crop file not isolated.")
