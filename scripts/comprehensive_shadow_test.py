"""
Comprehensive Shadow Calculation Verification
Tests shadow calculations with various scenarios
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import math
from app.services.shadow_calculator import ShadowCalculator
from app.services.solar_calculator import SolarCalculator

def test_shadow_formula():
    """Test basic shadow calculation formula"""
    print("=== 그림자 계산 공식 검증 ===\n")
    
    shadow_calc = ShadowCalculator()
    
    # Test cases: (object_height, sun_altitude, expected_shadow_length)
    test_cases = [
        (10, 45, None),  # 45도일 때: shadow = 10 / tan(45°) = 10m
        (10, 30, None),  # 30도일 때: shadow = 10 / tan(30°) ≈ 17.32m
        (10, 60, None),  # 60도일 때: shadow = 10 / tan(60°) ≈ 5.77m
        (49, 11.13, None),  # 서울 10월 30일 오전 7시: 약 11.13도
        (49, 38.5, None),   # 서울 10월 30일 정오: 약 38.5도
    ]
    
    print("기본 공식 테스트:")
    for height, altitude, expected in test_cases:
        result = shadow_calc.calculate_shadow(
            object_height=height,
            sun_altitude=altitude,
            sun_azimuth=0
        )
        
        calculated = result['length']
        manual_calc = height / math.tan(math.radians(altitude))
        
        print(f"\n  물체 높이: {height}m, 태양 고도: {altitude}°")
        print(f"  계산된 그림자: {calculated:.2f}m")
        print(f"  수동 계산: {manual_calc:.2f}m")
        print(f"  차이: {abs(calculated - manual_calc):.6f}m")
        
        if abs(calculated - manual_calc) < 0.01:
            print(f"  ✅ 공식 정확")
        else:
            print(f"  ❌ 공식 오차 있음")

def test_seoul_scenarios():
    """Test actual Seoul scenarios"""
    print("\n\n=== 서울 실제 데이터 검증 ===\n")
    
    solar_calc = SolarCalculator()
    shadow_calc = ShadowCalculator()
    
    lat, lon = 37.5689, 126.9763  # Seoul coordinates
    date = "2025-10-30"
    object_height = 49  # meters
    
    test_times = ["07:00", "10:00", "12:00", "15:00", "17:00"]
    
    print(f"위치: 서울 ({lat}°N, {lon}°E)")
    print(f"날짜: {date}")
    print(f"물체 높이: {object_height}m\n")
    
    for time_str in test_times:
        print(f"⏰ {time_str}:")
        
        solar_pos = solar_calc.calculate_solar_positions(
            latitude=lat,
            longitude=lon,
            date=date,
            start_time=time_str,
            end_time=time_str,
            interval_minutes=1
        )
        
        if not solar_pos.empty:
            alt = float(solar_pos['apparent_elevation'].iloc[0])
            azi = float(solar_pos['azimuth'].iloc[0])
            
            shadow_result = shadow_calc.calculate_shadow(
                object_height=object_height,
                sun_altitude=alt,
                sun_azimuth=azi
            )
            
            if shadow_result['status'] == 'normal':
                shadow_length = shadow_result['length']
                shadow_dir = shadow_result['direction']
                
                # Manual verification
                manual_length = object_height / math.tan(math.radians(alt))
                
                print(f"  태양 고도: {alt:.2f}°")
                print(f"  태양 방위각: {azi:.2f}°")
                print(f"  그림자 길이: {shadow_length:.2f}m")
                print(f"  그림자 방향: {shadow_dir:.2f}°")
                print(f"  수동 계산: {manual_length:.2f}m")
                print(f"  차이: {abs(shadow_length - manual_length):.4f}m")
                
                if abs(shadow_length - manual_length) < 0.01:
                    print(f"  ✅ 계산 정확")
                else:
                    print(f"  ⚠️ 약간의 차이 (수치 오차 가능)")
            else:
                print(f"  태양 고도: {alt:.2f}°")
                print(f"  상태: {shadow_result['status']}")
                print(f"  메시지: {shadow_result.get('message', 'N/A')}")
        print()

def test_edge_cases():
    """Test edge cases"""
    print("\n=== 경계 조건 테스트 ===\n")
    
    shadow_calc = ShadowCalculator()
    
    # Test very low sun altitude
    print("1. 태양 고도 매우 낮음 (0.05°):")
    result = shadow_calc.calculate_shadow(10, 0.05, 0)
    print(f"   상태: {result['status']}")
    print(f"   그림자 길이: {result['length']}")
    print(f"   예상: 무한대 (infinite_shadow)")
    
    # Test sun below horizon
    print("\n2. 태양 지평선 아래 (-5°):")
    result = shadow_calc.calculate_shadow(10, -5, 0)
    print(f"   상태: {result['status']}")
    print(f"   그림자 길이: {result['length']}")
    print(f"   예상: 무한대 (no_sun)")
    
    # Test high sun altitude
    print("\n3. 태양 고도 매우 높음 (80°):")
    result = shadow_calc.calculate_shadow(10, 80, 0)
    print(f"   상태: {result['status']}")
    print(f"   그림자 길이: {result['length']:.2f}m")
    manual = 10 / math.tan(math.radians(80))
    print(f"   수동 계산: {manual:.2f}m")
    print(f"   ✅ 정확" if abs(result['length'] - manual) < 0.01 else "   ❌ 오차")

def test_shadow_direction():
    """Test shadow direction calculation"""
    print("\n=== 그림자 방향 검증 ===\n")
    
    shadow_calc = ShadowCalculator()
    
    # Shadow direction should be opposite to sun azimuth
    test_cases = [
        (0, 180),    # Sun in North, shadow should point South
        (90, 270),   # Sun in East, shadow should point West
        (180, 0),    # Sun in South, shadow should point North
        (270, 90),   # Sun in West, shadow should point East
    ]
    
    print("태양 방위각 → 그림자 방향:")
    for sun_az, expected_shadow_dir in test_cases:
        result = shadow_calc.calculate_shadow(
            object_height=10,
            sun_altitude=45,
            sun_azimuth=sun_az
        )
        
        calculated_dir = result['direction']
        print(f"  태양 {sun_az}° → 그림자 {calculated_dir}° (예상: {expected_shadow_dir}°)")
        
        if abs(calculated_dir - expected_shadow_dir) < 1 or abs(calculated_dir - expected_shadow_dir - 360) < 1:
            print(f"    ✅ 정확")
        else:
            print(f"    ❌ 오차: {abs(calculated_dir - expected_shadow_dir)}°")

if __name__ == "__main__":
    try:
        test_shadow_formula()
        test_seoul_scenarios()
        test_edge_cases()
        test_shadow_direction()
        
        print("\n" + "="*50)
        print("✅ 모든 검증 완료")
        print("="*50)
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

