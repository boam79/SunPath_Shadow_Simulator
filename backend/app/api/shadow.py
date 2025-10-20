"""
Shadow Calculation API endpoints
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, Any, Optional
import uuid
from datetime import datetime

from app.models.schemas import Shadow
from app.services.shadow_calculator import ShadowCalculator
from app.services.solar_calculator import SolarCalculator

router = APIRouter()
shadow_calculator = ShadowCalculator()
solar_calculator = SolarCalculator()

@router.get("/calculate", response_model=Dict[str, Any])
async def calculate_shadow(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    time: str = Query(..., description="Time in HH:MM format"),
    object_height: float = Query(..., gt=0, le=1000, description="Object height in meters"),
    object_width: Optional[float] = Query(None, gt=0, description="Object width in meters (for polygon)"),
    terrain_slope: Optional[float] = Query(0, ge=0, le=90, description="Terrain slope in degrees"),
    terrain_aspect: Optional[float] = Query(0, ge=0, lt=360, description="Terrain aspect in degrees")
) -> Dict[str, Any]:
    """
    Calculate shadow properties for a given location, time, and object
    
    **기능:**
    - 그림자 길이 계산
    - 그림자 방향 계산
    - 그림자 끝점 좌표 계산
    - 지형 경사 보정 (선택)
    
    **특별 처리:**
    - 태양 고도 0° 이하: "태양이 지평선 아래"
    - 태양 고도 0.1° 이하: "무한 그림자"
    
    **예시:**
    `/api/shadow/calculate?lat=37.5665&lon=126.9780&date=2025-06-21&time=12:00&object_height=10`
    """
    try:
        # Calculate solar position for the given time
        solar_positions = solar_calculator.calculate_solar_positions(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time=time,
            end_time=time,
            interval_minutes=1
        )
        
        if solar_positions.empty:
            raise ValueError("Could not calculate solar position")
        
        # Get sun position
        sun_altitude = float(solar_positions['apparent_elevation'].iloc[0])
        sun_azimuth = float(solar_positions['azimuth'].iloc[0])
        
        # Calculate shadow
        shadow_result = shadow_calculator.calculate_shadow(
            object_height=object_height,
            sun_altitude=sun_altitude,
            sun_azimuth=sun_azimuth,
            terrain_slope=terrain_slope,
            terrain_aspect=terrain_aspect
        )
        
        # Calculate shadow endpoint
        end_lat, end_lon = None, None
        if shadow_result['status'] == 'normal':
            end_lat, end_lon = shadow_calculator.calculate_shadow_endpoint(
                start_lat=lat,
                start_lon=lon,
                shadow_length=shadow_result['length'],
                shadow_direction=shadow_result['direction']
            )
        
        # Calculate polygon if width provided
        polygon = None
        if object_width and shadow_result['status'] == 'normal':
            polygon = shadow_calculator.calculate_shadow_polygon(
                center_lat=lat,
                center_lon=lon,
                object_height=object_height,
                object_width=object_width,
                shadow_length=shadow_result['length'],
                shadow_direction=shadow_result['direction']
            )
        
        # Get description
        description = shadow_calculator.get_shadow_description(
            shadow_length=shadow_result['length'],
            shadow_direction=shadow_result['direction'] if shadow_result['direction'] else 0,
            object_height=object_height
        )
        
        return {
            'request_id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat(),
            'location': {
                'lat': lat,
                'lon': lon
            },
            'datetime': {
                'date': date,
                'time': time
            },
            'object': {
                'height': object_height,
                'width': object_width
            },
            'sun': {
                'altitude': sun_altitude,
                'azimuth': sun_azimuth
            },
            'shadow': {
                'length': shadow_result['length'],
                'direction': shadow_result['direction'],
                'status': shadow_result['status'],
                'message': shadow_result['message'],
                'endpoint': {
                    'lat': end_lat,
                    'lon': end_lon
                } if end_lat else None,
                'polygon': polygon,
                'description': description
            },
            'terrain': {
                'slope': terrain_slope,
                'aspect': terrain_aspect
            } if terrain_slope > 0 else None
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating shadow: {str(e)}"
        )

@router.get("/test")
async def test_shadow_calculation() -> Dict[str, Any]:
    """
    Test shadow calculation with standard test case
    
    **Test Case:**
    - Object: 10m tall
    - Sun altitude: 45°
    - Expected shadow: 10m ± 2%
    """
    try:
        # Test case: 10m object at 45° sun altitude
        object_height = 10.0
        sun_altitude = 45.0
        sun_azimuth = 180.0  # South
        
        result = shadow_calculator.calculate_shadow(
            object_height=object_height,
            sun_altitude=sun_altitude,
            sun_azimuth=sun_azimuth
        )
        
        # Validation
        validation = shadow_calculator.validate_shadow_calculation(
            object_height=object_height,
            sun_altitude=sun_altitude,
            expected_length=10.0,
            tolerance_percent=2.0
        )
        
        # Test extreme case
        extreme_result = shadow_calculator.calculate_shadow(
            object_height=10.0,
            sun_altitude=0.05,
            sun_azimuth=180.0
        )
        
        return {
            'test_case_1': {
                'description': '10m 물체, 태양 고도 45°',
                'object_height': f'{object_height}m',
                'sun_altitude': f'{sun_altitude}°',
                'calculated_shadow_length': f"{result['length']:.2f}m",
                'expected_shadow_length': '10.0m ± 2%',
                'validation': validation
            },
            'test_case_2': {
                'description': '극한 조건: 태양 고도 0.05°',
                'object_height': '10.0m',
                'sun_altitude': '0.05°',
                'result': extreme_result['status'],
                'message': extreme_result['message']
            },
            'overall_status': '✅ ALL TESTS PASSED' if validation['status'] == 'pass' else '❌ TESTS FAILED'
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'status': 'Test failed'
        }

@router.get("/validate")
async def validate_shadow_accuracy() -> Dict[str, Any]:
    """
    Validate shadow calculation accuracy with multiple test cases
    """
    try:
        test_cases = [
            {'height': 10, 'altitude': 45, 'expected': 10.0},
            {'height': 5, 'altitude': 30, 'expected': 8.66},
            {'height': 20, 'altitude': 60, 'expected': 11.55},
            {'height': 15, 'altitude': 15, 'expected': 56.04},
        ]
        
        results = []
        passed = 0
        failed = 0
        
        for tc in test_cases:
            validation = shadow_calculator.validate_shadow_calculation(
                object_height=tc['height'],
                sun_altitude=tc['altitude'],
                expected_length=tc['expected'],
                tolerance_percent=2.0
            )
            
            results.append({
                'test': f"H={tc['height']}m, Alt={tc['altitude']}°",
                'expected': tc['expected'],
                'calculated': validation.get('calculated'),
                'status': validation['status'],
                'message': validation['message']
            })
            
            if validation['status'] == 'pass':
                passed += 1
            else:
                failed += 1
        
        return {
            'total_tests': len(test_cases),
            'passed': passed,
            'failed': failed,
            'success_rate': f"{(passed/len(test_cases)*100):.1f}%",
            'results': results,
            'overall': '✅ ALL PASS' if failed == 0 else f'⚠️ {failed} FAILED'
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'status': 'Validation failed'
        }
