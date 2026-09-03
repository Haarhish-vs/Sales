import pyproj

def get_crs_transformer(source_crs):
    """
    Returns a PyProj transformer initialized to map from the native GeoTIFF CRS directly to WGS84 (Lat/Long).
    Returns None if the source CRS is unavailable or invalid.
    """
    if source_crs is None:
        return None
        
    try:
        # EPSG:4326 is standard GPS WGS84 (Lat/Long)
        return pyproj.Transformer.from_crs(source_crs, "EPSG:4326", always_xy=True)
    except Exception as e:
        print(f"Warning: Could not initialize CRS transformer. Geocoordinates will be empty. Error: {e}")
        return None

def pixel_to_latlon(transform, transformer, x_px, y_px):
    """
    Maps absolute image pixel coordinates into native geographical Latitude and Longitude.

    Args:
        transform (rasterio.Affine): The affine transformation matrix for the root GeoTIFF.
        transformer (pyproj.Transformer): The initialized WGS84 CRS transformer.
        x_px (float): X pixel coordinate inside the global TIFF.
        y_px (float): Y pixel coordinate inside the global TIFF.

    Returns:
        tuple: (Latitude (float), Longitude (float)), or (None, None) if transformer is missing.
    """
    if transform is None or transformer is None:
        return None, None
    
    # 1. Map raw Pixel to native Map-Coordinate System using Affine matrix
    map_x, map_y = transform * (x_px, y_px)
    
    # 2. Map native CRS to WGS84 Lat/Long
    lon, lat = transformer.transform(map_x, map_y)
    
    return lat, lon

def extract_polygon_bounds(global_polygon):
    """
    Determines bounding box coordinates from an uncompressed N-point geometrical polygon.
    Args:
        global_polygon (np.ndarray): Shape (N, 2) containing absolute pixel coords.
    Returns:
        tuple: (min_x, min_y, width, height)
    """
    if len(global_polygon) == 0:
        return 0, 0, 0, 0
    
    min_x = float(global_polygon[:, 0].min())
    max_x = float(global_polygon[:, 0].max())
    min_y = float(global_polygon[:, 1].min())
    max_y = float(global_polygon[:, 1].max())
    
    return min_x, min_y, (max_x - min_x), (max_y - min_y)
