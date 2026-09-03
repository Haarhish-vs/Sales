# ☀️ Local First Precision Solar Panel Analyzer

This repository strictly handles robust AI analysis of heavy thermal `GeoTIFF` orthomosaics natively over the local filesystem.
It breaks out processing logic into pristine geometric physics formulas mathematically translating bounding boxes to WGS84 and analytically cropping panels without destructive memory compression algorithms destroying structural data.

## 🛠️ Installation Requirements

Ensure you are on a robust developer machine. We explicitly bypass Cloud deployment environments to maximize radiometric extraction resolution.

1. **Clone this environment**.
2. Run standard pip requirements: 
   ```bash
   pip install -r requirements.txt
   ```

## 🧠 Missing Model Error 
This pipeline is locked. **Fallback models are structurally disabled.** If you start the app without a PyTorch weights file you will get an immediate `FileNotFoundError`.

1. Train or download a custom Solar Panel segmentation model (e.g., from Roboflow Universe via PyTorch Export) 
2. Specifically drop the `<name>.pt` file strictly into `models/solar_panel_best.pt` in the root of the engine repo. 
(You can override this filename via the graphical Streamlit parameter overrides).

## ▶️ Running Data Workloads Locally

1. Place your native `.tif` drone maps into `data/input`.
2. Initiate the web interface dashboard locally via Python:
   ```bash
   streamlit run app.py
   ```
3. A local Web UI will pop up on your monitor. 
4. Click `Start Precision Analysis`.

## 📁 System Topology Output
Inside `output/`, the algorithm isolates data mathematically into:
* `output/panels/`: Pristine mathematically extracted GeoTIFF cuts representing exact individual solar panels. Note these retain precise absolute coordinate metrics inside headers (`P001.tif`).
* `output/reports/`: Raw JSON/CSV analytical grids extracting minimum/maximum and standard deviations over valid polygon masks evaluating the state of panel thermography anomalies.
* `output/overview/`: An integrated view bounding visual identifiers mapping AI segmentation to global arrays natively.

## ⚙️ How Duplicates are Extracted
Due to computational RAM requirements we physically limit matrix allocations inside overlapping raster windows (`src/tiling.py`). Duplications near tile boundaries are mathematically nullified internally matching precise absolute volume intersections via absolute Shapely mask IoUs natively rather than volatile approximate bounding boxes (`src/deduplication.py`).
