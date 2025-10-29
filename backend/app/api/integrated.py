"""
Integrated API - combines solar position, shadow, and irradiance calculations
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import uuid
from datetime import datetime
import json
import math

from app.models.schemas import SolarCalculationRequest, SolarCalculationResponse
from app.services.solar_calculator import SolarCalculator
from app.services.shadow_calculator import ShadowCalculator
from app.services.irradiance_calculator import IrradianceCalculator
from app.models.schemas import Metadata, Accuracy, SolarSummary
from app.core.redis_client import cache_manager
from app.core.config import settings

router = APIRouter()
solar_calculator = SolarCalculator()
shadow_calculator = ShadowCalculator()
irradiance_calculator = IrradianceCalculator()

@router.post("/calculate", response_model=SolarCalculationResponse)
async def calculate_all(
    request: SolarCalculationRequest
) -> SolarCalculationResponse:
    """
    통합 계산: 태양 위치 + 그림자 + 일사량
    
    **한 번의 요청으로 모든 데이터 제공:**
    - 태양 고도/방위각 (시계열)
    - 일사량 (GHI/DNI/DHI)
    - 그림자 길이/방향 (물체 높이가 제공된 경우)
    
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
        "start_time": "05:00",
        "end_time": "20:00",
        "interval": 60
      },
      "object": {
        "height": 10
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
        
        object_height = request.object.height if request.object else None
        
        # Generate cache key
        cache_key = cache_manager.generate_cache_key(
            prefix="integrated",
            lat=lat,
            lon=lon,
            date=date,
            start=start_time,
            end=end_time,
            interval=interval,
            height=object_height
        )
        
        # Try to get from cache
        cached_result = cache_manager.get(cache_key)
        if cached_result:
            print(f"🎯 Cache HIT: {cache_key}")
            return SolarCalculationResponse(**cached_result)
        
        # Calculate irradiance
        irradiance_data = irradiance_calculator.calculate_clear_sky_irradiance(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time=start_time,
            end_time=end_time,
            interval_minutes=interval,
            altitude=altitude,
            model="ineichen"
        )
        
        # Calculate daily totals
        daily_totals = irradiance_calculator.calculate_daily_total_irradiance(
            irradiance_data=irradiance_data,
            interval_minutes=interval
        )
        
        # Get sunrise/sunset
        sun_times = solar_calculator.calculate_sunrise_sunset(lat, lon, date)
        
        # Get maximum altitude
        max_altitude = solar_calculator.get_max_solar_altitude(irradiance_data)
        
        # Helper to ensure JSON-safe floats (no NaN/Inf)
        def safe_number(value: float):
            try:
                f = float(value)
                if math.isnan(f) or math.isinf(f):
                    return None
                return f
            except (TypeError, ValueError):
                return None

        # Format series data with all information
        series_data = []
        for idx, row in irradiance_data.iterrows():
            sun_alt = safe_number(row['apparent_elevation'])
            sun_azi = safe_number(row['azimuth'])
            sun_zen = safe_number(row['apparent_zenith'])

            ghi = safe_number(row['ghi'])
            dni = safe_number(row['dni'])
            dhi = safe_number(row['dhi'])
            par_val = safe_number(irradiance_calculator.calculate_par(row['ghi']))

            data_point = {
                'timestamp': idx.isoformat(),
                'sun': {
                    'altitude': sun_alt,
                    'azimuth': sun_azi,
                    'zenith': sun_zen,
                    'hour_angle': 0
                },
                'irradiance': {
                    'ghi': ghi,
                    'dni': dni,
                    'dhi': dhi,
                    'par': par_val
                }
            }
            
            # Add shadow if object height provided
            if request.object and request.object.height:
                shadow_result = shadow_calculator.calculate_shadow(
                    object_height=request.object.height,
                    sun_altitude=row['apparent_elevation'],
                    sun_azimuth=row['azimuth']
                )
                
                end_lat, end_lon = None, None
                if shadow_result['status'] == 'normal':
                    end_lat, end_lon = shadow_calculator.calculate_shadow_endpoint(
                        start_lat=lat,
                        start_lon=lon,
                        shadow_length=shadow_result['length'],
                        shadow_direction=shadow_result['direction']
                    )
                
                length_val = None if math.isinf(shadow_result['length']) else safe_number(shadow_result['length'])
                direction_val = shadow_result['direction'] if shadow_result['direction'] is not None else None

                data_point['shadow'] = {
                    'length': length_val,
                    'direction': direction_val,
                    'coordinates': [[lon, lat], [end_lon, end_lat]] if (end_lon is not None and end_lat is not None) else None
                }
            else:
                data_point['shadow'] = None
            
            series_data.append(data_point)
        
        # Create response
        response = SolarCalculationResponse(
            metadata=Metadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.utcnow().isoformat(),
                version="0.1.0",
                accuracy=Accuracy(
                    position=0.05,
                    irradiance=5.0
                )
            ),
            summary=SolarSummary(
                sunrise=sun_times['sunrise'] or "N/A",
                sunset=sun_times['sunset'] or "N/A",
                solar_noon=sun_times['solar_noon'] or "N/A",
                day_length=sun_times['day_length'],
                max_altitude=max_altitude,
                total_irradiance=daily_totals['ghi']
            ),
            series=series_data
        )
        
        # Cache the result
        print(f"💾 Cache MISS: {cache_key} - Storing result")
        cache_manager.set(cache_key, response.model_dump(), ttl=settings.REDIS_CACHE_TTL)
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}"
        )
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Missing data column: {str(e)}"
        )
    except Exception as e:
        # Log unexpected errors for debugging
        print(f"❌ Unexpected error in calculate_all: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error: {type(e).__name__}"
        )
