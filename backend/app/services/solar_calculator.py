"""
Solar Position Calculator using pvlib-python
NREL SPA (Solar Position Algorithm) implementation
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any, Optional
import pvlib
from pvlib import solarposition, irradiance
from app.core.config import settings
from app.services.timezone_utils import resolve_timezone, timezone_label

class SolarCalculator:
    """
    High-precision solar position calculator using NREL SPA algorithm
    Accuracy: ±0.0003° (2000-6000년)
    """
    
    def __init__(self):
        self.pressure = settings.DEFAULT_PRESSURE
        self.temperature = settings.DEFAULT_TEMPERATURE
    
    def calculate_solar_positions(
        self,
        latitude: float,
        longitude: float,
        date: str,
        start_time: str = "00:00",
        end_time: str = "23:59",
        interval_minutes: int = 60,
        altitude: float = 0,
        pressure: float = None,
        temperature: float = None,
        apply_refraction: bool = True,
        timezone_name: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        Calculate solar positions for a given location and time range
        
        Args:
            latitude: Latitude in degrees (-90 to 90)
            longitude: Longitude in degrees (-180 to 180)
            date: Date in ISO 8601 format (YYYY-MM-DD)
            start_time: Start time (HH:MM)
            end_time: End time (HH:MM)
            interval_minutes: Time interval in minutes
            altitude: Elevation above sea level in meters
            pressure: Atmospheric pressure in mbar (default: 1013.25)
            temperature: Temperature in Celsius (default: 15)
            apply_refraction: Prefer apparent_* (True) vs geometric elevation/zenith
            timezone_name: Optional IANA timezone
            
        Returns:
            DataFrame with columns: timestamp, apparent_zenith, zenith, 
                                   apparent_elevation, elevation, azimuth
            Plus attrs: used_timezone, apply_refraction
        """
        if pressure is None:
            pressure = self.pressure
        if temperature is None:
            temperature = self.temperature
        
        date_obj = datetime.fromisoformat(date)
        start_dt = datetime.combine(date_obj.date(), 
                                    datetime.strptime(start_time, "%H:%M").time())
        end_dt = datetime.combine(date_obj.date(), 
                                 datetime.strptime(end_time, "%H:%M").time())
        
        tz = resolve_timezone(latitude, longitude, timezone_name)
        
        times = pd.date_range(
            start=start_dt,
            end=end_dt,
            freq=f'{interval_minutes}min'
        )
        
        try:
            times = times.tz_localize(tz)
        except (ValueError, TypeError) as e:
            print(f"⚠️ Timezone localization failed: {e}. Using UTC.")
            times = times.tz_localize('UTC')
            tz = resolve_timezone(0, 0, 'UTC')
        
        solar_pos = solarposition.get_solarposition(
            time=times,
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            pressure=pressure,
            temperature=temperature,
            method='nrel_numpy'
        )
        
        # Expose which columns consumers should prefer
        solar_pos.attrs['apply_refraction'] = apply_refraction
        solar_pos.attrs['used_timezone'] = timezone_label(tz)
        
        return solar_pos
    
    def calculate_sunrise_sunset(
        self,
        latitude: float,
        longitude: float,
        date: str,
        timezone_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculate sunrise, sunset, and solar noon times
        
        Args:
            latitude: Latitude in degrees
            longitude: Longitude in degrees
            date: Date in ISO 8601 format (YYYY-MM-DD)
            timezone_name: Optional IANA timezone
            
        Returns:
            Dictionary with sunrise, sunset, solar_noon, and day_length
        """
        tz = resolve_timezone(latitude, longitude, timezone_name)
        
        try:
            date_obj = pd.Timestamp(date).tz_localize(tz)
        except (ValueError, TypeError) as e:
            print(f"⚠️ Timezone localization failed in sunrise_sunset: {e}. Using UTC.")
            date_obj = pd.Timestamp(date).tz_localize('UTC')
        
        times = pd.DatetimeIndex([date_obj])
        sun_times = solarposition.sun_rise_set_transit_spa(
            times,
            latitude,
            longitude
        )
        
        sunrise = sun_times['sunrise'].iloc[0]
        sunset = sun_times['sunset'].iloc[0]
        solar_noon = sun_times['transit'].iloc[0]
        
        if pd.notna(sunrise) and pd.notna(sunset):
            day_length = (sunset - sunrise).total_seconds() / 3600
        elif pd.isna(sunrise) and pd.isna(sunset):
            # Polar day vs polar night: check noon elevation
            noon_dt = pd.Timestamp(f"{date}T12:00:00").tz_localize(tz)
            noon_pos = solarposition.get_solarposition(
                time=pd.DatetimeIndex([noon_dt]),
                latitude=latitude,
                longitude=longitude,
                method='nrel_numpy',
            )
            noon_alt = float(noon_pos['apparent_elevation'].iloc[0])
            day_length = 24.0 if noon_alt > 0 else 0.0
        else:
            print(f"⚠️ Anomalous sun times: sunrise={sunrise}, sunset={sunset}")
            day_length = 0.0
        
        return {
            'sunrise': sunrise.isoformat() if pd.notna(sunrise) else None,
            'sunset': sunset.isoformat() if pd.notna(sunset) else None,
            'solar_noon': solar_noon.isoformat() if pd.notna(solar_noon) else None,
            'day_length': day_length,
            'timezone': timezone_label(tz),
        }
    
    def get_max_solar_altitude(
        self,
        solar_positions: pd.DataFrame,
        apply_refraction: bool = True,
    ) -> float:
        """
        Get maximum solar altitude from positions DataFrame
        """
        col = 'apparent_elevation' if apply_refraction else 'elevation'
        if col not in solar_positions.columns:
            col = 'apparent_elevation'
        return float(solar_positions[col].max())
    
    def format_solar_position_series(
        self,
        solar_positions: pd.DataFrame,
        apply_refraction: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Format solar positions DataFrame into list of dictionaries
        """
        result = []
        alt_col = 'apparent_elevation' if apply_refraction else 'elevation'
        zen_col = 'apparent_zenith' if apply_refraction else 'zenith'
        if alt_col not in solar_positions.columns:
            alt_col = 'apparent_elevation'
        if zen_col not in solar_positions.columns:
            zen_col = 'apparent_zenith'
        
        for idx, row in solar_positions.iterrows():
            data_point = {
                'timestamp': idx.isoformat(),
                'sun': {
                    'altitude': float(row[alt_col]),
                    'azimuth': float(row['azimuth']),
                    'zenith': float(row[zen_col]),
                    'hour_angle': self._calculate_hour_angle(idx, row['azimuth'])
                }
            }
            result.append(data_point)
        
        return result
    
    def _calculate_hour_angle(self, timestamp: pd.Timestamp, azimuth: float) -> float:
        """
        Approximate hour angle from local clock time (15°/hour from noon).
        azimuth kept for API compatibility.
        """
        _ = azimuth
        hour_of_day = timestamp.hour + timestamp.minute / 60
        solar_noon = 12.0
        return (hour_of_day - solar_noon) * 15
    
    def validate_extreme_conditions(
        self,
        latitude: float,
        date: str
    ) -> Dict[str, Any]:
        """
        Check for extreme conditions (polar day/night, etc.)
        """
        abs_lat = abs(latitude)
        date_obj = datetime.fromisoformat(date)
        day_of_year = date_obj.timetuple().tm_yday
        
        is_polar = abs_lat > 66.5
        
        is_polar_day = False
        is_polar_night = False
        
        if is_polar:
            if latitude > 0:
                is_polar_day = 152 <= day_of_year <= 213
                is_polar_night = 335 <= day_of_year or day_of_year <= 59
            else:
                is_polar_day = 335 <= day_of_year or day_of_year <= 59
                is_polar_night = 152 <= day_of_year <= 213
        
        return {
            'is_polar_region': is_polar,
            'is_polar_day': is_polar_day,
            'is_polar_night': is_polar_night,
            'warning': self._get_condition_warning(is_polar, is_polar_day, is_polar_night)
        }
    
    def _get_condition_warning(
        self,
        is_polar: bool,
        is_polar_day: bool,
        is_polar_night: bool
    ) -> str:
        """Generate warning message for extreme conditions"""
        if is_polar_day:
            return "극지방 백야(Midnight Sun) 기간입니다. 태양이 지평선 아래로 내려가지 않습니다."
        elif is_polar_night:
            return "극지방 극야(Polar Night) 기간입니다. 태양이 지평선 위로 올라오지 않습니다."
        elif is_polar:
            return "극지방 지역입니다. 태양 경로가 특이할 수 있습니다."
        return None
