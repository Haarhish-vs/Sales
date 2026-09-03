import numpy as np

def extract_thermal_stats(raw_data_array, c2f=False):
    """
    Processes radiometric matrices to extract strict physics analysis numbers.
    Treats background/NoData (often 0 or distinct edge values) accurately by evaluating strictly on panel matrices.
    
    Args:
        raw_data_array (np.ndarray): Shape (Bands, Height, Width) from original Tiff slice.
        c2f (bool): Trigger if radiometric cells are literal Celsius decimals needing Fahrenheit translations.
        
    Returns:
        dict: min, max, mean, median, std, p95, anomalous_pixels
    """
    if raw_data_array is None or raw_data_array.size == 0:
        return {}
        
    # Standardize down to a 1D vector bypassing multi-band logic. We typically treat thermal as Band 1.
    matrix_1d = raw_data_array[0].ravel() if raw_data_array.ndim == 3 else raw_data_array.ravel()
    
    # Prune null pixels natively
    valid_pixels = matrix_1d[matrix_1d > 0]
    
    if len(valid_pixels) == 0:
        return {}
        
    min_temp = float(np.min(valid_pixels))
    max_temp = float(np.max(valid_pixels))
    mean_temp = float(np.mean(valid_pixels))
    median_temp = float(np.median(valid_pixels))
    std_temp = float(np.std(valid_pixels))
    p95_temp = float(np.percentile(valid_pixels, 95))
    
    if c2f:
        min_temp = (min_temp * 9/5) + 32
        max_temp = (max_temp * 9/5) + 32
        mean_temp = (mean_temp * 9/5) + 32
        median_temp = (median_temp * 9/5) + 32
        std_temp = std_temp * 9/5  # Dev scale metric
        p95_temp = (p95_temp * 9/5) + 32
        
    # Calculate relative thermal gradient mapping anomaly hotspots natively
    anomaly_threshold = p95_temp + std_temp # Robust threshold definition independent of rigid constants
    hotspot_pixel_count = int(np.sum(valid_pixels > anomaly_threshold))
    hotspot_percentage = float(hotspot_pixel_count / len(valid_pixels)) * 100
    
    status = "NORMAL"
    if hotspot_percentage > 1.0:
        status = "HOTSPOT"
    elif hotspot_percentage > 0.05:
        status = "WARNING"
        
    return {
        "Min_Thermal": round(min_temp, 2),
        "Max_Thermal": round(max_temp, 2),
        "Mean_Thermal": round(mean_temp, 2),
        "Median_Thermal": round(median_temp, 2),
        "Std_Thermal": round(std_temp, 2),
        "P95_Thermal": round(p95_temp, 2),
        "Hotspot_Pixels": hotspot_pixel_count,
        "Hotspot_Percentage": round(hotspot_percentage, 3),
        "Status": status
    }
