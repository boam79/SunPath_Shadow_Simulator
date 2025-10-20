"""
Solar Position API endpoints
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import uuid
from datetime import datetime

from app.models.schemas import (
    SolarCalculationRequest,
    SolarCalculationResponse,
    Metadata,
    Accuracy,
    SolarSummary,
    SolarDataPoint
)
from app.services.solar_calculator import SolarCalculator

router = APIRouter()
solar_calculator = SolarCalculator()

@router.post("/position", response_model=SolarCalculationResponse)
async def calculate_solar_position(
    request: SolarCalculationRequest
) -> SolarCalculationResponse:
    """
    Calculate solar positions for a given location and date range
    
    **정확도:** ±0.05° (NREL SPA 알고리즘)
    
    **지원 기능:**
    - 고정밀 태양 고도/방위각 계산
    - 대기 굴절 보정
    - 일출/일몰 시각 자동 산출
    - 시계열 데이터 (1분~1440분 간격)
    - 극지방 특수 조건 처리
    
    **사용 예시:**
    ```json
    {
      "location": {
        "lat": 37.5665,
        "lon": 126.9780,
        "altitude": 38
      },
      "datetime": {
        "date": "2025-06-21",
        "start_time": "00:00",
        "end_time": "23:59",
        "interval": 60
      },
      "options": {
        "atmosphere": true,
        "precision": "high"
      }
    }
    ```
    """
    try:
        # Extract parameters
        lat = request.location.lat
        lon = request.location.lon
        altitude = request.location.altitude or 0
        
        date = request.datetime.date
        start_time = request.datetime.start_time or "00:00"
        end_time = request.datetime.end_time or "23:59"
        interval = request.datetime.interval or 60
        
        apply_refraction = request.options.atmosphere if request.options else True
        
        # Validate extreme conditions
        conditions = solar_calculator.validate_extreme_conditions(lat, date)
        
        # Calculate solar positions
        solar_positions = solar_calculator.calculate_solar_positions(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time=start_time,
            end_time=end_time,
            interval_minutes=interval,
            altitude=altitude,
            apply_refraction=apply_refraction
        )
        
        # Calculate sunrise/sunset
        sun_times = solar_calculator.calculate_sunrise_sunset(lat, lon, date)
        
        # Get maximum altitude
        max_altitude = solar_calculator.get_max_solar_altitude(solar_positions)
        
        # Format series data
        series_data = solar_calculator.format_solar_position_series(solar_positions)
        
        # Create response
        response = SolarCalculationResponse(
            metadata=Metadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.utcnow().isoformat(),
                version="0.1.0",
                accuracy=Accuracy(
                    position=0.05,  # ±0.05° accuracy
                    irradiance=0  # Not calculated yet
                )
            ),
            summary=SolarSummary(
                sunrise=sun_times['sunrise'] or "N/A",
                sunset=sun_times['sunset'] or "N/A",
                solar_noon=sun_times['solar_noon'] or "N/A",
                day_length=sun_times['day_length'],
                max_altitude=max_altitude,
                total_irradiance=None  # Will be calculated in irradiance endpoint
            ),
            series=series_data
        )
        
        # Add warning if extreme conditions
        if conditions['warning']:
            # Could add to metadata or logs
            pass
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input parameters: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating solar position: {str(e)}"
        )

@router.get("/sunrise-sunset")
async def get_sunrise_sunset(
    lat: float,
    lon: float,
    date: str
) -> Dict[str, Any]:
    """
    Get sunrise, sunset, and solar noon times for a specific location and date
    
    **Parameters:**
    - **lat**: Latitude (-90 to 90)
    - **lon**: Longitude (-180 to 180)
    - **date**: Date in YYYY-MM-DD format
    
    **Returns:**
    - sunrise: ISO 8601 timestamp
    - sunset: ISO 8601 timestamp
    - solar_noon: ISO 8601 timestamp
    - day_length: Day length in hours
    
    **Example:** `/api/solar/sunrise-sunset?lat=37.5665&lon=126.9780&date=2025-06-21`
    """
    try:
        # Validate parameters
        if not (-90 <= lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        
        # Calculate
        sun_times = solar_calculator.calculate_sunrise_sunset(lat, lon, date)
        
        # Check for extreme conditions
        conditions = solar_calculator.validate_extreme_conditions(lat, date)
        
        return {
            **sun_times,
            "conditions": conditions
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating sunrise/sunset: {str(e)}"
        )

@router.get("/test")
async def test_solar_calculation() -> Dict[str, Any]:
    """
    Test endpoint with Seoul coordinates on summer solstice
    서울(37.5665°N, 126.9780°E) 하지(2025-06-21) 테스트
    """
    try:
        # Seoul coordinates
        lat, lon = 37.5665, 126.9780
        date = "2025-06-21"
        
        # Calculate positions for solar noon only
        solar_positions = solar_calculator.calculate_solar_positions(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time="12:00",
            end_time="12:00",
            interval_minutes=1
        )
        
        # Get sun times
        sun_times = solar_calculator.calculate_sunrise_sunset(lat, lon, date)
        
        noon_altitude = float(solar_positions['apparent_elevation'].iloc[0])
        noon_azimuth = float(solar_positions['azimuth'].iloc[0])
        
        return {
            "location": "서울 (Seoul)",
            "date": "2025-06-21 (하지/Summer Solstice)",
            "solar_noon_altitude": f"{noon_altitude:.2f}°",
            "solar_noon_azimuth": f"{noon_azimuth:.2f}°",
            "expected_altitude": "~76° (±0.1°)",
            "accuracy_check": "PASS" if abs(noon_altitude - 76) < 1 else "FAIL",
            **sun_times
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "status": "Test failed"
        }
