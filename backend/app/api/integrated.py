"""
Integrated API - combines solar position, shadow, and irradiance calculations
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
import uuid
from datetime import datetime
import json
import math
import asyncio
import time

from app.models.schemas import (
    SolarCalculationRequest, 
    SolarCalculationResponse,
    BatchCalculationRequest,
    BatchCalculationResponse,
    BatchCalculationResponseItem
)
from app.services.solar_calculator import SolarCalculator
from app.services.shadow_calculator import ShadowCalculator
from app.services.irradiance_calculator import IrradianceCalculator
from app.services.optimizer import OptimizationService
from app.models.schemas import Metadata, Accuracy, SolarSummary
from app.core.redis_client import cache_manager
from app.core.config import settings

router = APIRouter()
solar_calculator = SolarCalculator()
shadow_calculator = ShadowCalculator()
irradiance_calculator = IrradianceCalculator()
optimizer = OptimizationService()

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

@router.post("/batch", response_model=BatchCalculationResponse)
async def calculate_batch(
    request: BatchCalculationRequest
) -> BatchCalculationResponse:
    """
    Batch calculation: process multiple scenarios in a single request
    
    **배치 계산 기능:**
    - 여러 위치 동시 계산
    - 여러 날짜 동시 계산
    - 여러 조건 조합 계산
    - 병렬 처리로 성능 최적화
    - 개별 결과 및 통계 제공
    
    **사용 예시:**
    ```json
    {
      "requests": [
        {
          "location": { "lat": 37.5665, "lon": 126.9780 },
          "datetime": { "date": "2025-06-21" },
          "object": { "height": 10 }
        },
        {
          "location": { "lat": 35.1796, "lon": 129.0756 },
          "datetime": { "date": "2025-06-21" },
          "object": { "height": 10 }
        }
      ],
      "parallel": true
    }
    ```
    """
    start_time = time.time()
    total_requests = len(request.requests)
    
    def process_single_request_sync(req: SolarCalculationRequest) -> SolarCalculationResponse:
        """Synchronous version of calculate_all core logic"""
        # Extract parameters
        lat = req.location.lat
        lon = req.location.lon
        altitude = req.location.altitude or 0
        
        date = req.datetime.date
        start_time = req.datetime.start_time or "00:00"
        end_time = req.datetime.end_time or "23:59"
        interval = req.datetime.interval or 60
        
        object_height = req.object.height if req.object else None
        
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
            if req.object and req.object.height:
                shadow_result = shadow_calculator.calculate_shadow(
                    object_height=req.object.height,
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
    
    async def process_single_request(req: SolarCalculationRequest, index: int) -> BatchCalculationResponseItem:
        """Process a single calculation request"""
        try:
            # Run synchronous calculation in thread pool
            result = await asyncio.to_thread(process_single_request_sync, req)
            return BatchCalculationResponseItem(
                index=index,
                success=True,
                result=result,
                error=None
            )
        except Exception as e:
            return BatchCalculationResponseItem(
                index=index,
                success=False,
                result=None,
                error=str(e)
            )
    
    try:
        if request.parallel and total_requests > 1:
            # Parallel processing for better performance
            tasks = [process_single_request(req, idx) for idx, req in enumerate(request.requests)]
            results = await asyncio.gather(*tasks)
        else:
            # Sequential processing
            results = []
            for idx, req in enumerate(request.requests):
                result = await process_single_request(req, idx)
                results.append(result)
        
        # Calculate statistics
        successful = sum(1 for r in results if r.success)
        failed = total_requests - successful
        processing_time_ms = (time.time() - start_time) * 1000
        
        return BatchCalculationResponse(
            total_requests=total_requests,
            successful=successful,
            failed=failed,
            processing_time_ms=round(processing_time_ms, 2),
            results=results
        )
        
    except Exception as e:
        print(f"❌ Error in calculate_batch: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch calculation error: {type(e).__name__}"
        )

@router.post("/optimize")
async def optimize_periods(
    response: SolarCalculationResponse
) -> Dict[str, Any]:
    """
    Analyze solar calculation results to find optimal time periods
    
    **최적화 분석:**
    - 최대 일사량 시간대
    - 최대 태양 고도 시간대
    - 최소 그림자 시간대
    - 최적 태양광 수집 시간대 (연속 구간)
    - 그림자 간섭 시간대
    
    **사용 예시:**
    ```json
    POST /api/integrated/optimize
    {
      // SolarCalculationResponse 결과를 그대로 전달
    }
    ```
    """
    try:
        # Convert series to dict format for optimizer
        series_data = []
        for point in response.series:
            point_dict = {
                'timestamp': point.timestamp,
                'sun': {
                    'altitude': point.sun.altitude,
                    'azimuth': point.sun.azimuth,
                    'zenith': point.sun.zenith,
                    'hour_angle': point.sun.hour_angle
                },
                'irradiance': {
                    'ghi': point.irradiance.ghi if point.irradiance else None,
                    'dni': point.irradiance.dni if point.irradiance else None,
                    'dhi': point.irradiance.dhi if point.irradiance else None,
                    'par': point.irradiance.par if point.irradiance else None
                } if point.irradiance else None,
                'shadow': {
                    'length': point.shadow.length if point.shadow else None,
                    'direction': point.shadow.direction if point.shadow else None,
                    'coordinates': point.shadow.coordinates if point.shadow else None
                } if point.shadow else None
            }
            series_data.append(point_dict)
        
        # Analyze optimal periods
        optimization_result = optimizer.analyze_optimal_periods(series_data)
        
        return {
            "status": "success",
            "optimization": optimization_result
        }
        
    except Exception as e:
        print(f"❌ Error in optimize_periods: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization error: {type(e).__name__}"
        )
