import rasterio
from rasterio.windows import Window
import traceback

def crop_panel_geotiff(source_dataset, min_x, min_y, width, height, output_path):
    """
    Extracts literally pristine raw radiometric thermal data directly out from the original master TIFF.
    Uses Rasterio windowed I/O to avoid RAM crashes and guarantee 0 data-compression loss.
    
    Args:
        source_dataset (rasterio.DatasetReader): The opened source file context.
        min_x (int): BBox Top-Left X global.
        min_y (int): BBox Top-Left Y global.
        width (int): BBox Width global.
        height (int): BBox Height global.
        output_path (str): Full path to output the sliced Geotiff.
        
    Returns:
        np.ndarray: The exact uncompressed RAW multi-band pixel arrays inside the box for thermal analysis.
    """
    try:
        # Buffer coordinates out safely
        min_x = max(0, int(min_x) - 2)
        min_y = max(0, int(min_y) - 2)
        width = int(width) + 4
        height = int(height) + 4
        
        # Guard strictly against bounding outside the image
        if min_x >= source_dataset.width or min_y >= source_dataset.height:
            return None
        width = min(width, source_dataset.width - min_x)
        height = min(height, source_dataset.height - min_y)
        if width <= 0 or height <= 0:
            return None
            
        win = Window(min_x, min_y, width, height)
        # Slices across absolute depth respecting ALL BANDS flawlessly
        raw_data = source_dataset.read(window=win)
        
        # Translate Geocoordinates matrix identically
        window_transform = source_dataset.window_transform(win)
        
        profile = source_dataset.profile
        profile.update({
            'height': height,
            'width': width,
            'transform': window_transform,
            'nodata': source_dataset.nodata
        })
        
        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(raw_data)
            
        # Return slice geometry to calculate heat metrics against
        return raw_data
        
    except Exception as e:
        print(f"Extraction failed for panel! Trace: {traceback.format_exc()}")
        return None
