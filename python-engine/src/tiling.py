import math
from rasterio.windows import Window
import numpy as np

def generate_tiles(image_width, image_height, tile_size=1024, overlap=0.25):
    """
    Generates a sequence of overlapping Rasterio windows for efficient out-of-core inference.
    
    Args:
        image_width (int): Total width of the GeoTIFF in pixels.
        image_height (int): Total height of the GeoTIFF in pixels.
        tile_size (int): Dimension of each square tile.
        overlap (float): Ratio of overlap between neighboring tiles (e.g. 0.25 for 25%).
        
    Yields:
        tuple: (window, (x_offset, y_offset))
            window: rasterio.windows.Window instance spanning the tile coordinates.
            (x_offset, y_offset): Absolute pixel translation relative to root image.
    """
    step = int(tile_size * (1 - overlap))
    
    x_coords = list(range(0, image_width, step))
    y_coords = list(range(0, image_height, step))
    
    # Ensure edges are fully covered if they don't align with step multiples perfectly
    if x_coords[-1] + tile_size < image_width:
        x_coords.append(image_width - tile_size)
    if y_coords[-1] + tile_size < image_height:
        y_coords.append(image_height - tile_size)

    # Sanitize edge-clamped coordinates to prevent going out-of-bounds natively
    x_coords = [max(0, x) for x in x_coords]
    y_coords = [max(0, y) for y in y_coords]
    
    # Dedup just in case the edge clamp aligned perfectly with the last step
    x_coords = sorted(list(set(x_coords)))
    y_coords = sorted(list(set(y_coords)))

    for y in y_coords:
        for x in x_coords:
            # Use actual boundary limitations just in case the file is smaller than one tile
            w = min(tile_size, image_width - x)
            h = min(tile_size, image_height - y)
            
            window = Window(x, y, w, h)
            yield window, (x, y)
