"""
Irradiance Calculator
Calculate solar irradiance using Clear Sky Models
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from pvlib import irradiance, atmosphere, location
from app.services.solar_calculator import SolarCalculator

class IrradianceCalculator:
    """
    Calculate solar irradiance (GHI, DNI, DHI) using Clear Sky Models
    """
    
    def __init__(self):
        self.solar_calculator = SolarCalculator()
    
    def calculate_clear_sky_irradiance(
        self,
        latitude: float,
        longitude: float,
        date: str,
        start_time: str = "00:00",
        end_time: str = "23:59",
        interval_minutes: int = 60,
        altitude: float = 0,
        model: str = "ineichen"
    ) -> pd.DataFrame:
        """
        Calculate clear sky irradiance using specified model
        
        Args:
            latitude: Latitude in degrees
            longitude: Longitude in degrees
            date: Date in ISO 8601 format
            start_time: Start time (HH:MM)
            end_time: End time (HH:MM)
            interval_minutes: Time interval in minutes
            altitude: Elevation above sea level in meters
            model: Clear sky model ('ineichen', 'haurwitz', 'simplified_solis')
            
        Returns:
            DataFrame with GHI, DNI, DHI columns
        """
        # Create Location object
        loc = location.Location(
            latitude=latitude,
            longitude=longitude,
            altitude=altitude
        )
        
        # Get solar positions
        solar_positions = self.solar_calculator.calculate_solar_positions(
            latitude=latitude,
            longitude=longitude,
            date=date,
            start_time=start_time,
            end_time=end_time,
            interval_minutes=interval_minutes,
            altitude=altitude
        )
        
        # Calculate clear sky irradiance using Location object
        clearsky = loc.get_clearsky(
            times=solar_positions.index,
            model=model
        )
        
        # Combine with solar positions
        result = pd.concat([solar_positions, clearsky], axis=1)
        
        return result
    
    def calculate_daily_total_irradiance(
        self,
        irradiance_data: pd.DataFrame,
        interval_minutes: int = 60
    ) -> Dict[str, float]:
        """
        Calculate daily total irradiance (integration)
        
        Args:
            irradiance_data: DataFrame with ghi, dni, dhi columns
            interval_minutes: Time interval in minutes
            
        Returns:
            Dictionary with total GHI, DNI, DHI in kWh/m²
        """
        # Convert interval to hours
        interval_hours = interval_minutes / 60.0
        
        # Integrate using trapezoidal rule (W/m² * hours → Wh/m² → kWh/m²)
        total_ghi = np.trapz(irradiance_data['ghi'].values) * interval_hours / 1000
        total_dni = np.trapz(irradiance_data['dni'].values) * interval_hours / 1000
        total_dhi = np.trapz(irradiance_data['dhi'].values) * interval_hours / 1000
        
        return {
            'ghi': float(total_ghi),
            'dni': float(total_dni),
            'dhi': float(total_dhi)
        }
    
    def calculate_poa_irradiance(
        self,
        ghi: float,
        dni: float,
        dhi: float,
        solar_zenith: float,
        solar_azimuth: float,
        surface_tilt: float,
        surface_azimuth: float,
        albedo: float = 0.2
    ) -> Dict[str, float]:
        """
        Calculate Plane of Array (POA) irradiance for tilted surfaces
        
        Args:
            ghi: Global Horizontal Irradiance (W/m²)
            dni: Direct Normal Irradiance (W/m²)
            dhi: Diffuse Horizontal Irradiance (W/m²)
            solar_zenith: Solar zenith angle (degrees)
            solar_azimuth: Solar azimuth angle (degrees)
            surface_tilt: Surface tilt from horizontal (degrees)
            surface_azimuth: Surface azimuth (degrees)
            albedo: Ground reflectance (0-1)
            
        Returns:
            Dictionary with POA components
        """
        # Calculate angle of incidence
        aoi = irradiance.aoi(
            surface_tilt=surface_tilt,
            surface_azimuth=surface_azimuth,
            solar_zenith=solar_zenith,
            solar_azimuth=solar_azimuth
        )
        
        # Calculate POA components
        poa_components = irradiance.get_total_irradiance(
            surface_tilt=surface_tilt,
            surface_azimuth=surface_azimuth,
            solar_zenith=solar_zenith,
            solar_azimuth=solar_azimuth,
            dni=dni,
            ghi=ghi,
            dhi=dhi,
            albedo=albedo,
            model='isotropic'
        )
        
        return {
            'poa_global': float(poa_components['poa_global']),
            'poa_direct': float(poa_components['poa_direct']),
            'poa_diffuse': float(poa_components['poa_diffuse']),
            'poa_sky_diffuse': float(poa_components['poa_sky_diffuse']),
            'poa_ground_diffuse': float(poa_components['poa_ground_diffuse']),
            'aoi': float(aoi)
        }
    
    def calculate_par(
        self,
        ghi: float
    ) -> float:
        """
        Calculate Photosynthetically Active Radiation (PAR)
        PAR is approximately 45% of GHI
        
        Args:
            ghi: Global Horizontal Irradiance (W/m²)
            
        Returns:
            PAR in W/m²
        """
        # PAR is typically 400-700nm wavelength, ~45% of total solar radiation
        par = ghi * 0.45
        return float(par)
    
    def format_irradiance_series(
        self,
        irradiance_data: pd.DataFrame,
        include_par: bool = False,
        surface_tilt: float = None,
        surface_azimuth: float = None,
        albedo: float = 0.2
    ) -> List[Dict[str, Any]]:
        """
        Format irradiance data into list of dictionaries
        
        Args:
            irradiance_data: DataFrame from calculate_clear_sky_irradiance
            include_par: Include PAR calculation
            surface_tilt: Surface tilt for POA calculation (optional)
            surface_azimuth: Surface azimuth for POA calculation (optional)
            albedo: Ground reflectance for POA calculation
            
        Returns:
            List of irradiance data points
        """
        result = []
        
        for idx, row in irradiance_data.iterrows():
            data_point = {
                'timestamp': idx.isoformat(),
                'ghi': float(row['ghi']),
                'dni': float(row['dni']),
                'dhi': float(row['dhi'])
            }
            
            # Add PAR if requested
            if include_par:
                data_point['par'] = self.calculate_par(row['ghi'])
            
            # Add POA if surface parameters provided
            if surface_tilt is not None and surface_azimuth is not None:
                poa = self.calculate_poa_irradiance(
                    ghi=row['ghi'],
                    dni=row['dni'],
                    dhi=row['dhi'],
                    solar_zenith=row['apparent_zenith'],
                    solar_azimuth=row['azimuth'],
                    surface_tilt=surface_tilt,
                    surface_azimuth=surface_azimuth,
                    albedo=albedo
                )
                data_point['poa'] = poa
            
            result.append(data_point)
        
        return result
    
    def get_irradiance_statistics(
        self,
        irradiance_data: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Calculate statistics for irradiance data
        
        Args:
            irradiance_data: DataFrame with irradiance values
            
        Returns:
            Dictionary with statistics
        """
        return {
            'ghi': {
                'max': float(irradiance_data['ghi'].max()),
                'mean': float(irradiance_data['ghi'].mean()),
                'min': float(irradiance_data['ghi'].min()),
                'std': float(irradiance_data['ghi'].std())
            },
            'dni': {
                'max': float(irradiance_data['dni'].max()),
                'mean': float(irradiance_data['dni'].mean()),
                'min': float(irradiance_data['dni'].min()),
                'std': float(irradiance_data['dni'].std())
            },
            'dhi': {
                'max': float(irradiance_data['dhi'].max()),
                'mean': float(irradiance_data['dhi'].mean()),
                'min': float(irradiance_data['dhi'].min()),
                'std': float(irradiance_data['dhi'].std())
            }
        }
    
    def validate_irradiance_values(
        self,
        ghi: float,
        dni: float,
        dhi: float
    ) -> Dict[str, Any]:
        """
        Validate irradiance values for physical consistency
        
        Args:
            ghi: Global Horizontal Irradiance
            dni: Direct Normal Irradiance
            dhi: Diffuse Horizontal Irradiance
            
        Returns:
            Validation result
        """
        issues = []
        
        # Check for negative values
        if ghi < 0:
            issues.append("GHI is negative")
        if dni < 0:
            issues.append("DNI is negative")
        if dhi < 0:
            issues.append("DHI is negative")
        
        # Check for unrealistic values (> solar constant ~1367 W/m²)
        if ghi > 1500:
            issues.append(f"GHI too high ({ghi:.0f} W/m²)")
        if dni > 1500:
            issues.append(f"DNI too high ({dni:.0f} W/m²)")
        if dhi > 1000:
            issues.append(f"DHI too high ({dhi:.0f} W/m²)")
        
        # Check relationship: GHI ≈ DNI * cos(zenith) + DHI
        # This is a simplified check
        if ghi > 0 and (dni + dhi) > 0:
            ratio = ghi / (dni + dhi)
            if ratio > 1.5 or ratio < 0.5:
                issues.append(f"Inconsistent GHI/DNI/DHI relationship (ratio: {ratio:.2f})")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues if issues else None,
            'message': 'All values valid' if len(issues) == 0 else f"{len(issues)} issues found"
        }
