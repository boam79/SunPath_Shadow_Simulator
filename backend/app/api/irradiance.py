"""
Irradiance Calculation API endpoints
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, Any, Optional
import uuid
from datetime import datetime

from app.services.irradiance_calculator import IrradianceCalculator

router = APIRouter()
irradiance_calculator = IrradianceCalculator()

@router.get("/calculate", response_model=Dict[str, Any])
async def calculate_irradiance(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    start_time: str = Query("00:00", description="Start time in HH:MM format"),
    end_time: str = Query("23:59", description="End time in HH:MM format"),
    interval: int = Query(60, ge=1, le=1440, description="Time interval in minutes"),
    altitude: float = Query(0, ge=0, description="Elevation in meters"),
    model: str = Query("ineichen", description="Clear sky model (ineichen, haurwitz, simplified_solis)"),
    include_par: bool = Query(False, description="Include PAR calculation"),
    surface_tilt: Optional[float] = Query(None, ge=0, le=90, description="Surface tilt angle (degrees)"),
    surface_azimuth: Optional[float] = Query(None, ge=0, lt=360, description="Surface azimuth (degrees)")
) -> Dict[str, Any]:
    """
    Calculate solar irradiance for a given location and time range
    
    **일사량 종류:**
    - **GHI** (Global Horizontal Irradiance): 수평면 전일사량
    - **DNI** (Direct Normal Irradiance): 직달 일사량
    - **DHI** (Diffuse Horizontal Irradiance): 산란 일사량
    - **PAR** (Photosynthetically Active Radiation): 광합성 유효 복사 (선택)
    
    **Clear Sky Models:**
    - **ineichen**: 가장 정확 (기본값, 권장)
    - **haurwitz**: 빠른 계산
    - **simplified_solis**: 중간 정확도
    
    **예시:**
    `/api/irradiance/calculate?lat=37.5665&lon=126.9780&date=2025-06-21&interval=60&model=ineichen`
    """
    try:
        # Calculate irradiance
        irradiance_data = irradiance_calculator.calculate_clear_sky_irradiance(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time=start_time,
            end_time=end_time,
            interval_minutes=interval,
            altitude=altitude,
            model=model
        )
        
        # Calculate daily totals
        daily_totals = irradiance_calculator.calculate_daily_total_irradiance(
            irradiance_data=irradiance_data,
            interval_minutes=interval
        )
        
        # Get statistics
        statistics = irradiance_calculator.get_irradiance_statistics(irradiance_data)
        
        # Format series data
        series_data = irradiance_calculator.format_irradiance_series(
            irradiance_data=irradiance_data,
            include_par=include_par,
            surface_tilt=surface_tilt,
            surface_azimuth=surface_azimuth
        )
        
        return {
            'request_id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat(),
            'location': {
                'lat': lat,
                'lon': lon,
                'altitude': altitude
            },
            'datetime': {
                'date': date,
                'start_time': start_time,
                'end_time': end_time,
                'interval': interval
            },
            'model': model,
            'daily_totals': daily_totals,
            'statistics': statistics,
            'data_points': len(series_data),
            'series': series_data
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating irradiance: {str(e)}"
        )

@router.get("/test")
async def test_irradiance_calculation() -> Dict[str, Any]:
    """
    Test irradiance calculation
    
    **Test Case:**
    - Location: 서울
    - Date: 2025-06-21 (하지)
    - Expected: GHI ~1000 W/m² at noon ± 10%
    """
    try:
        # Seoul, summer solstice
        lat, lon = 37.5665, 126.9780
        date = "2025-06-21"
        
        # Calculate irradiance at solar noon
        irradiance_data = irradiance_calculator.calculate_clear_sky_irradiance(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time="12:00",
            end_time="12:00",
            interval_minutes=1,
            model="ineichen"
        )
        
        # Calculate full day for totals
        full_day_data = irradiance_calculator.calculate_clear_sky_irradiance(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time="00:00",
            end_time="23:59",
            interval_minutes=60,
            model="ineichen"
        )
        
        daily_totals = irradiance_calculator.calculate_daily_total_irradiance(
            full_day_data,
            interval_minutes=60
        )
        
        noon_ghi = float(irradiance_data['ghi'].iloc[0])
        noon_dni = float(irradiance_data['dni'].iloc[0])
        noon_dhi = float(irradiance_data['dhi'].iloc[0])
        
        # Validate
        validation = irradiance_calculator.validate_irradiance_values(
            ghi=noon_ghi,
            dni=noon_dni,
            dhi=noon_dhi
        )
        
        # Check if noon GHI is around 1000 W/m² ± 10%
        expected_ghi = 1000
        ghi_error_percent = abs(noon_ghi - expected_ghi) / expected_ghi * 100
        ghi_pass = ghi_error_percent <= 10
        
        return {
            'test_case': {
                'location': '서울 (Seoul)',
                'date': '2025-06-21 (하지/Summer Solstice)',
                'time': '12:00 (Solar Noon)',
                'model': 'Ineichen Clear Sky'
            },
            'noon_irradiance': {
                'ghi': f'{noon_ghi:.2f} W/m²',
                'dni': f'{noon_dni:.2f} W/m²',
                'dhi': f'{noon_dhi:.2f} W/m²',
                'par': f'{irradiance_calculator.calculate_par(noon_ghi):.2f} W/m²'
            },
            'validation': {
                'expected_ghi': f'{expected_ghi} W/m² ± 10%',
                'error': f'{ghi_error_percent:.2f}%',
                'status': '✅ PASS' if ghi_pass else '❌ FAIL',
                'physical_check': validation
            },
            'daily_totals': {
                'ghi': f"{daily_totals['ghi']:.2f} kWh/m²",
                'dni': f"{daily_totals['dni']:.2f} kWh/m²",
                'dhi': f"{daily_totals['dhi']:.2f} kWh/m²"
            },
            'overall_status': '✅ ALL TESTS PASSED' if ghi_pass and validation['valid'] else '❌ TESTS FAILED'
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'status': 'Test failed'
        }

@router.get("/sunrise-sunset-irradiance")
async def get_sunrise_sunset_irradiance(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    date: str = Query(...)
) -> Dict[str, Any]:
    """
    Get sunrise/sunset times with irradiance at those moments
    
    **사용 예시:**
    `/api/irradiance/sunrise-sunset-irradiance?lat=37.5665&lon=126.9780&date=2025-06-21`
    """
    try:
        # Get sunrise/sunset times
        sun_times = irradiance_calculator.solar_calculator.calculate_sunrise_sunset(
            lat, lon, date
        )
        
        if not sun_times['sunrise'] or not sun_times['sunset']:
            return {
                'message': '극지방 특수 조건 (백야 또는 극야)',
                'sun_times': sun_times
            }
        
        # Extract time from ISO strings
        sunrise_time = sun_times['sunrise'].split('T')[1].split('+')[0][:5]
        sunset_time = sun_times['sunset'].split('T')[1].split('+')[0][:5]
        
        # Calculate irradiance at sunrise
        sunrise_data = irradiance_calculator.calculate_clear_sky_irradiance(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time=sunrise_time,
            end_time=sunrise_time,
            interval_minutes=1
        )
        
        # Calculate irradiance at sunset
        sunset_data = irradiance_calculator.calculate_clear_sky_irradiance(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time=sunset_time,
            end_time=sunset_time,
            interval_minutes=1
        )
        
        return {
            'sunrise': {
                'time': sun_times['sunrise'],
                'ghi': f"{float(sunrise_data['ghi'].iloc[0]):.2f} W/m²"
            },
            'sunset': {
                'time': sun_times['sunset'],
                'ghi': f"{float(sunset_data['ghi'].iloc[0]):.2f} W/m²"
            },
            'day_length': f"{sun_times['day_length']:.2f} hours"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )
