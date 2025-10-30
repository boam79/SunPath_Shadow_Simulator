"""
Optimization Service - Analyze solar data to find optimal time periods
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import math

class OptimizationService:
    """Analyze solar data and provide optimization recommendations"""
    
    def analyze_optimal_periods(self, solar_data_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze solar data to find optimal time periods
        
        Returns:
        - max_irradiance_period: Time with maximum GHI
        - max_altitude_period: Time with maximum solar altitude
        - min_shadow_period: Time with minimum shadow length
        - optimal_solar_collection_periods: List of periods with high irradiance
        - shadow_interference_periods: List of periods with significant shadow
        """
        if not solar_data_points:
            return {
                "max_irradiance_period": None,
                "max_altitude_period": None,
                "min_shadow_period": None,
                "optimal_solar_collection_periods": [],
                "shadow_interference_periods": []
            }
        
        max_ghi = -1
        max_ghi_time = None
        max_altitude = -1
        max_altitude_time = None
        min_shadow = float('inf')
        min_shadow_time = None
        
        optimal_periods = []
        shadow_periods = []
        
        for point in solar_data_points:
            timestamp = point.get('timestamp', '')
            time_obj = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            time_str = time_obj.strftime('%H:%M')
            
            # Max irradiance
            irradiance = point.get('irradiance')
            if irradiance and isinstance(irradiance, dict):
                ghi_val = irradiance.get('ghi', 0)
                if ghi_val and ghi_val > max_ghi:
                    max_ghi = ghi_val
                    max_ghi_time = {
                        'time': time_str,
                        'ghi': max_ghi,
                        'altitude': point.get('sun', {}).get('altitude', 0)
                    }
            
            # Max altitude
            sun_data = point.get('sun', {})
            altitude = sun_data.get('altitude', 0) if sun_data else 0
            if altitude > max_altitude:
                max_altitude = altitude
                ghi_val = irradiance.get('ghi', 0) if irradiance and isinstance(irradiance, dict) else 0
                max_altitude_time = {
                    'time': time_str,
                    'altitude': max_altitude,
                    'ghi': ghi_val
                }
            
            # Min shadow
            shadow_data = point.get('shadow')
            if shadow_data and isinstance(shadow_data, dict):
                shadow_length = shadow_data.get('length')
                if shadow_length is not None and isinstance(shadow_length, (int, float)):
                    if shadow_length < min_shadow and shadow_length > 0:
                        min_shadow = shadow_length
                        ghi_val = irradiance.get('ghi', 0) if irradiance and isinstance(irradiance, dict) else 0
                        min_shadow_time = {
                            'time': time_str,
                            'shadow_length': min_shadow,
                            'ghi': ghi_val
                        }
            
            # Optimal solar collection periods (GHI > 600 W/m²)
            if irradiance and isinstance(irradiance, dict):
                ghi_val = irradiance.get('ghi', 0)
                if ghi_val and ghi_val > 600:
                    optimal_periods.append({
                        'time': time_str,
                        'ghi': ghi_val,
                        'altitude': altitude,
                        'dni': irradiance.get('dni', 0)
                    })
            
            # Shadow interference periods (shadow > 10m)
            if shadow_data and isinstance(shadow_data, dict):
                shadow_len = shadow_data.get('length')
                if shadow_len is not None and isinstance(shadow_len, (int, float)):
                    if shadow_len > 10 and shadow_len != float('inf'):
                        ghi_val = irradiance.get('ghi', 0) if irradiance and isinstance(irradiance, dict) else 0
                        shadow_periods.append({
                            'time': time_str,
                            'shadow_length': shadow_len,
                            'ghi': ghi_val
                        })
        
        # Find continuous optimal periods
        continuous_optimal = self._find_continuous_periods(optimal_periods)
        continuous_shadow = self._find_continuous_periods(shadow_periods)
        
        return {
            "max_irradiance_period": max_ghi_time,
            "max_altitude_period": max_altitude_time,
            "min_shadow_period": min_shadow_time if min_shadow != float('inf') else None,
            "optimal_solar_collection_periods": continuous_optimal,
            "shadow_interference_periods": continuous_shadow
        }
    
    def _find_continuous_periods(self, periods: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Find continuous time periods from list of time points"""
        if not periods:
            return []
        
        # Sort by time
        sorted_periods = sorted(periods, key=lambda x: x['time'])
        
        continuous = []
        current_start = sorted_periods[0]['time']
        current_end = sorted_periods[0]['time']
        current_avg_ghi = sorted_periods[0].get('ghi', 0)
        count = 1
        
        for i in range(1, len(sorted_periods)):
            prev_time = self._time_to_minutes(sorted_periods[i-1]['time'])
            curr_time = self._time_to_minutes(sorted_periods[i]['time'])
            
            # If within 2 hours (120 minutes), consider continuous
            if curr_time - prev_time <= 120:
                current_end = sorted_periods[i]['time']
                current_avg_ghi += sorted_periods[i].get('ghi', 0)
                count += 1
            else:
                # Save current period
                if count > 0:
                    continuous.append({
                        'start': current_start,
                        'end': current_end,
                        'average_ghi': current_avg_ghi / count if count > 0 else 0,
                        'duration_hours': (self._time_to_minutes(current_end) - self._time_to_minutes(current_start)) / 60
                    })
                
                # Start new period
                current_start = sorted_periods[i]['time']
                current_end = sorted_periods[i]['time']
                current_avg_ghi = sorted_periods[i].get('ghi', 0)
                count = 1
        
        # Add last period
        if count > 0:
            continuous.append({
                'start': current_start,
                'end': current_end,
                'average_ghi': current_avg_ghi / count if count > 0 else 0,
                'duration_hours': (self._time_to_minutes(current_end) - self._time_to_minutes(current_start)) / 60
            })
        
        return continuous
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM string to minutes since midnight"""
        parts = time_str.split(':')
        return int(parts[0]) * 60 + int(parts[1])

