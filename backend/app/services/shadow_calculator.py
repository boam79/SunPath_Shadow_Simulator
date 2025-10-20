"""
Shadow Calculator
Calculates shadow length, direction, and coordinates based on sun position
"""
import math
from typing import Dict, Any, List, Tuple, Optional

class ShadowCalculator:
    """
    Calculate shadow properties based on solar position
    """
    
    def __init__(self):
        self.EPSILON = 0.1  # Minimum sun altitude (degrees) for shadow calculation
    
    def calculate_shadow(
        self,
        object_height: float,
        sun_altitude: float,
        sun_azimuth: float,
        terrain_slope: float = 0,
        terrain_aspect: float = 0
    ) -> Dict[str, Any]:
        """
        Calculate shadow length and direction
        
        Args:
            object_height: Height of object in meters
            sun_altitude: Solar altitude angle in degrees
            sun_azimuth: Solar azimuth angle in degrees (0=North, 90=East)
            terrain_slope: Terrain slope in degrees (optional)
            terrain_aspect: Terrain aspect/direction in degrees (optional)
            
        Returns:
            Dictionary with shadow length, direction, and status
        """
        # Check for special cases
        if sun_altitude <= 0:
            return {
                'length': float('inf'),
                'direction': None,
                'status': 'no_sun',
                'message': '태양이 지평선 아래에 있습니다.'
            }
        
        if sun_altitude <= self.EPSILON:
            return {
                'length': float('inf'),
                'direction': (sun_azimuth + 180) % 360,
                'status': 'infinite_shadow',
                'message': f'태양 고도가 매우 낮습니다 ({sun_altitude:.2f}°). 그림자가 무한대로 길어집니다.'
            }
        
        # Calculate basic shadow length
        # Formula: shadow_length = object_height / tan(sun_altitude)
        sun_altitude_rad = math.radians(sun_altitude)
        shadow_length = object_height / math.tan(sun_altitude_rad)
        
        # Apply terrain correction if needed
        if terrain_slope > 0:
            slope_correction = self._calculate_slope_correction(
                terrain_slope,
                terrain_aspect,
                sun_azimuth,
                sun_altitude
            )
            shadow_length *= slope_correction
        
        # Shadow direction is opposite to sun azimuth
        shadow_direction = (sun_azimuth + 180) % 360
        
        return {
            'length': abs(shadow_length),
            'direction': shadow_direction,
            'status': 'normal',
            'message': None
        }
    
    def calculate_shadow_endpoint(
        self,
        start_lat: float,
        start_lon: float,
        shadow_length: float,
        shadow_direction: float
    ) -> Tuple[float, float]:
        """
        Calculate the endpoint coordinates of shadow
        
        Args:
            start_lat: Starting latitude (object location)
            start_lon: Starting longitude (object location)
            shadow_length: Length of shadow in meters
            shadow_direction: Direction of shadow in degrees (0=North)
            
        Returns:
            Tuple of (end_latitude, end_longitude)
        """
        if math.isinf(shadow_length):
            return None, None
        
        # Earth radius in meters
        EARTH_RADIUS = 6371000
        
        # Convert to radians
        lat_rad = math.radians(start_lat)
        lon_rad = math.radians(start_lon)
        direction_rad = math.radians(shadow_direction)
        
        # Calculate angular distance
        angular_distance = shadow_length / EARTH_RADIUS
        
        # Calculate end point using spherical geometry
        end_lat_rad = math.asin(
            math.sin(lat_rad) * math.cos(angular_distance) +
            math.cos(lat_rad) * math.sin(angular_distance) * math.cos(direction_rad)
        )
        
        end_lon_rad = lon_rad + math.atan2(
            math.sin(direction_rad) * math.sin(angular_distance) * math.cos(lat_rad),
            math.cos(angular_distance) - math.sin(lat_rad) * math.sin(end_lat_rad)
        )
        
        # Convert back to degrees
        end_lat = math.degrees(end_lat_rad)
        end_lon = math.degrees(end_lon_rad)
        
        # Normalize longitude to [-180, 180]
        end_lon = ((end_lon + 180) % 360) - 180
        
        return end_lat, end_lon
    
    def calculate_shadow_polygon(
        self,
        center_lat: float,
        center_lon: float,
        object_height: float,
        object_width: float,
        shadow_length: float,
        shadow_direction: float
    ) -> List[List[float]]:
        """
        Calculate shadow polygon coordinates for a rectangular object
        
        Args:
            center_lat: Object center latitude
            center_lon: Object center longitude
            object_height: Object height in meters
            object_width: Object width in meters
            shadow_length: Shadow length in meters
            shadow_direction: Shadow direction in degrees
            
        Returns:
            List of [lon, lat] coordinates forming shadow polygon
        """
        if math.isinf(shadow_length):
            return None
        
        # Calculate perpendicular direction
        perp_direction = (shadow_direction - 90) % 360
        
        # Calculate corner offsets
        half_width = object_width / 2
        
        # Object corners
        corners = []
        for offset_dir in [perp_direction, (perp_direction + 180) % 360]:
            corner_lat, corner_lon = self.calculate_shadow_endpoint(
                center_lat, center_lon, half_width, offset_dir
            )
            corners.append([corner_lon, corner_lat])
        
        # Shadow endpoints
        shadow_corners = []
        for corner in corners:
            end_lat, end_lon = self.calculate_shadow_endpoint(
                corner[1], corner[0], shadow_length, shadow_direction
            )
            shadow_corners.append([end_lon, end_lat])
        
        # Create polygon: object corners + shadow corners (clockwise)
        polygon = corners + shadow_corners[::-1]
        
        return polygon
    
    def _calculate_slope_correction(
        self,
        terrain_slope: float,
        terrain_aspect: float,
        sun_azimuth: float,
        sun_altitude: float
    ) -> float:
        """
        Calculate shadow length correction factor for sloped terrain
        
        Args:
            terrain_slope: Slope angle in degrees
            terrain_aspect: Direction of slope in degrees
            sun_azimuth: Solar azimuth in degrees
            sun_altitude: Solar altitude in degrees
            
        Returns:
            Correction factor (multiplier for shadow length)
        """
        # Convert to radians
        slope_rad = math.radians(terrain_slope)
        aspect_rad = math.radians(terrain_aspect)
        sun_az_rad = math.radians(sun_azimuth)
        sun_alt_rad = math.radians(sun_altitude)
        
        # Calculate angle between sun and slope normal
        # This is a simplified calculation
        # Full 3D terrain shadow calculation would be more complex
        
        # Angle between shadow direction and slope aspect
        angle_diff = abs(sun_azimuth - terrain_aspect)
        if angle_diff > 180:
            angle_diff = 360 - angle_diff
        angle_diff_rad = math.radians(angle_diff)
        
        # Correction factor based on slope and sun position
        # When shadow goes upslope, it's shorter
        # When shadow goes downslope, it's longer
        correction = 1.0 + (math.sin(slope_rad) * math.cos(angle_diff_rad) / 
                           math.tan(sun_alt_rad))
        
        return max(0.1, correction)  # Ensure positive and reasonable
    
    def validate_shadow_calculation(
        self,
        object_height: float,
        sun_altitude: float,
        expected_length: float,
        tolerance_percent: float = 2.0
    ) -> Dict[str, Any]:
        """
        Validate shadow calculation against expected values
        
        Args:
            object_height: Object height in meters
            sun_altitude: Sun altitude in degrees
            expected_length: Expected shadow length in meters
            tolerance_percent: Acceptable error percentage
            
        Returns:
            Validation result with pass/fail status
        """
        result = self.calculate_shadow(object_height, sun_altitude, 0)
        calculated_length = result['length']
        
        if math.isinf(calculated_length):
            return {
                'status': 'skipped',
                'message': 'Shadow is infinite (sun too low)'
            }
        
        error = abs(calculated_length - expected_length)
        error_percent = (error / expected_length) * 100
        
        passed = error_percent <= tolerance_percent
        
        return {
            'status': 'pass' if passed else 'fail',
            'calculated': calculated_length,
            'expected': expected_length,
            'error': error,
            'error_percent': error_percent,
            'tolerance': tolerance_percent,
            'message': f"{'✅ PASS' if passed else '❌ FAIL'}: {error_percent:.2f}% error"
        }
    
    def get_shadow_description(
        self,
        shadow_length: float,
        shadow_direction: float,
        object_height: float
    ) -> str:
        """
        Get human-readable shadow description
        
        Args:
            shadow_length: Shadow length in meters
            shadow_direction: Shadow direction in degrees
            object_height: Object height in meters
            
        Returns:
            Descriptive string
        """
        if math.isinf(shadow_length):
            return "그림자가 무한대로 길어집니다 (태양이 매우 낮음)"
        
        ratio = shadow_length / object_height
        
        # Direction description
        directions = [
            "북쪽", "북동쪽", "동쪽", "남동쪽",
            "남쪽", "남서쪽", "서쪽", "북서쪽"
        ]
        idx = int((shadow_direction + 22.5) / 45) % 8
        direction_desc = directions[idx]
        
        # Length description
        if ratio < 1:
            length_desc = "짧은"
        elif ratio < 3:
            length_desc = "중간 길이의"
        else:
            length_desc = "긴"
        
        return f"{length_desc} 그림자가 {direction_desc}으로 {shadow_length:.2f}m 뻗어있습니다 (높이의 {ratio:.1f}배)"
