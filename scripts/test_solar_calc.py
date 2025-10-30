"""
Test actual solar calculations for Seoul on Oct 30, 2025
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.solar_calculator import SolarCalculator
from app.services.shadow_calculator import ShadowCalculator
from app.services.irradiance_calculator import IrradianceCalculator

def test_seoul_oct30():
    """Test calculations for Seoul on Oct 30, 2025"""
    
    lat, lon = 37.5721, 126.9971  # Seoul from image
    date = "2025-10-30"
    object_height = 49  # meters from image
    
    solar_calc = SolarCalculator()
    shadow_calc = ShadowCalculator()
    irradiance_calc = IrradianceCalculator()
    
    print("=== 서울 10월 30일 실제 계산 검증 ===\n")
    
    # Test 7 AM (from image: shadow 17,270m)
    print("📅 오전 7시 (07:00):")
    solar_pos_7am = solar_calc.calculate_solar_positions(
        latitude=lat,
        longitude=lon,
        date=date,
        start_time="07:00",
        end_time="07:00",
        interval_minutes=1
    )
    
    if not solar_pos_7am.empty:
        alt_7am = float(solar_pos_7am['apparent_elevation'].iloc[0])
        azi_7am = float(solar_pos_7am['azimuth'].iloc[0])
        
        shadow_7am = shadow_calc.calculate_shadow(
            object_height=object_height,
            sun_altitude=alt_7am,
            sun_azimuth=azi_7am
        )
        
        print(f"  태양 고도: {alt_7am:.4f}°")
        print(f"  태양 방위각: {azi_7am:.2f}°")
        print(f"  그림자 길이: {shadow_7am['length']:.2f}m" if not shadow_7am['status'] == 'infinite_shadow' else f"  그림자 길이: 무한대 ({shadow_7am['status']})")
        print(f"  이미지 값: 17,270.93m")
        if not shadow_7am['status'] == 'infinite_shadow' and not isinstance(shadow_7am['length'], str):
            diff = abs(shadow_7am['length'] - 17270.93)
            print(f"  차이: {diff:.2f}m ({diff/17270.93*100:.2f}%)")
        
        # Verify calculation
        expected_shadow = object_height / __import__('math').tan(__import__('math').radians(alt_7am))
        print(f"  검증 계산: {expected_shadow:.2f}m")
        print(f"  ✅ 계산식 정확도: {'✅ 정확' if abs(expected_shadow - shadow_7am['length']) < 0.01 else '❌ 오차 있음'}")
    
    # Test 10 AM
    print("\n📅 오전 10시 (10:00):")
    solar_pos_10am = solar_calc.calculate_solar_positions(
        latitude=lat,
        longitude=lon,
        date=date,
        start_time="10:00",
        end_time="10:00",
        interval_minutes=1
    )
    
    if not solar_pos_10am.empty:
        alt_10am = float(solar_pos_10am['apparent_elevation'].iloc[0])
        shadow_10am = shadow_calc.calculate_shadow(
            object_height=object_height,
            sun_altitude=alt_10am,
            sun_azimuth=float(solar_pos_10am['azimuth'].iloc[0])
        )
        print(f"  태양 고도: {alt_10am:.2f}°")
        print(f"  그림자 길이: {shadow_10am['length']:.2f}m" if not shadow_10am['status'] == 'infinite_shadow' else "  그림자 길이: 무한대")
        print(f"  물체 높이 대비: {shadow_10am['length']/object_height:.2f}배" if not shadow_10am['status'] == 'infinite_shadow' else "  N/A")
    
    # Test noon
    print("\n📅 정오 (12:00):")
    solar_pos_noon = solar_calc.calculate_solar_positions(
        latitude=lat,
        longitude=lon,
        date=date,
        start_time="12:00",
        end_time="12:00",
        interval_minutes=1
    )
    
    if not solar_pos_noon.empty:
        alt_noon = float(solar_pos_noon['apparent_elevation'].iloc[0])
        shadow_noon = shadow_calc.calculate_shadow(
            object_height=object_height,
            sun_altitude=alt_noon,
            sun_azimuth=float(solar_pos_noon['azimuth'].iloc[0])
        )
        print(f"  태양 고도: {alt_noon:.2f}°")
        print(f"  그림자 길이: {shadow_noon['length']:.2f}m" if not shadow_noon['status'] == 'infinite_shadow' else "  그림자 길이: 무한대")
        print(f"  물체 높이 대비: {shadow_noon['length']/object_height:.2f}배" if not shadow_noon['status'] == 'infinite_shadow' else "  N/A")
    
    # Test irradiance at noon
    print("\n📅 정오 일사량 검증:")
    irradiance_data = irradiance_calc.calculate_clear_sky_irradiance(
        latitude=lat,
        longitude=lon,
        date=date,
        start_time="12:00",
        end_time="12:00",
        interval_minutes=1
    )
    
    if not irradiance_data.empty:
        ghi_noon = float(irradiance_data['ghi'].iloc[0])
        dni_noon = float(irradiance_data['dni'].iloc[0])
        dhi_noon = float(irradiance_data['dhi'].iloc[0])
        print(f"  GHI: {ghi_noon:.2f} W/m²")
        print(f"  DNI: {dni_noon:.2f} W/m²")
        print(f"  DHI: {dhi_noon:.2f} W/m²")
        print(f"  이미지 값: ~750-800 W/m²")
        print(f"  ✅ 값 범위: {'✅ 적절' if 600 <= ghi_noon <= 900 else '⚠️ 주의'} (10월 말 서울 정오)")
    
    # Check sunrise/sunset
    print("\n📅 일출/일몰:")
    sun_times = solar_calc.calculate_sunrise_sunset(lat, lon, date)
    print(f"  일출: {sun_times.get('sunrise', 'N/A')}")
    print(f"  일몰: {sun_times.get('sunset', 'N/A')}")
    print(f"  일조 시간: {sun_times.get('day_length', 0):.1f}시간")
    
    # Summary
    print("\n=== 검증 요약 ===")
    if not solar_pos_7am.empty:
        alt_7am = float(solar_pos_7am['apparent_elevation'].iloc[0])
        if alt_7am > 0.1 and alt_7am < 1.0:
            print("✅ 오전 7시 태양 고도가 일출 직후 범위에 있습니다.")
            print(f"   (실제: {alt_7am:.4f}°, 이미지 예상: ~0.16°)")
        elif alt_7am <= 0.1:
            print("⚠️ 오전 7시 태양 고도가 EPSILON(0.1°)보다 낮습니다.")
            print("   그림자가 무한대로 처리되어야 합니다.")
        else:
            print(f"✅ 오전 7시 태양 고도: {alt_7am:.2f}° (정상 범위)")

if __name__ == "__main__":
    try:
        test_seoul_oct30()
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

