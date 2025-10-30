"""
Shadow Calculation Verification Script
Verifies if shadow calculations are correct
"""
import math

def verify_shadow_calculation():
    """Verify shadow calculation formula"""
    
    # From image: 49m height, 17270.93m shadow at 7 AM
    object_height = 49  # meters
    shadow_length = 17270.93  # meters
    
    # Calculate what sun altitude this would require
    # Formula: shadow_length = object_height / tan(sun_altitude)
    # Therefore: tan(sun_altitude) = object_height / shadow_length
    
    tan_altitude = object_height / shadow_length
    calculated_altitude = math.degrees(math.atan(tan_altitude))
    
    print(f"=== 그림자 계산 검증 ===")
    print(f"물체 높이: {object_height}m")
    print(f"그림자 길이: {shadow_length:.2f}m")
    print(f"필요한 태양 고도: {calculated_altitude:.4f}°")
    print(f"tan(태양 고도): {tan_altitude:.6f}")
    
    # Check if this is reasonable for Seoul at 7 AM on Oct 30
    print(f"\n=== 검증 결과 ===")
    if calculated_altitude < 0.1:
        print(f"⚠️ 태양 고도가 {calculated_altitude:.4f}°로 매우 낮습니다.")
        print(f"   EPSILON (0.1°)보다 낮아 무한대 그림자로 처리되어야 합니다.")
    elif calculated_altitude < 1.0:
        print(f"✅ 태양 고도 {calculated_altitude:.4f}°는 일출 직후로 타당합니다.")
        print(f"   하지만 그림자 길이가 {shadow_length/1000:.2f}km로 매우 깁니다.")
    
    # Verify reverse calculation
    print(f"\n=== 역계산 검증 ===")
    test_altitude = calculated_altitude
    calculated_shadow = object_height / math.tan(math.radians(test_altitude))
    print(f"태양 고도 {test_altitude:.4f}°일 때:")
    print(f"계산된 그림자 길이: {calculated_shadow:.2f}m")
    print(f"실제 그림자 길이: {shadow_length:.2f}m")
    print(f"차이: {abs(calculated_shadow - shadow_length):.2f}m")
    
    # Check for 10 AM case (should be much shorter)
    print(f"\n=== 오전 10시 예상 값 ===")
    # Typical sun altitude for Seoul Oct 30 at 10 AM: ~30-35 degrees
    test_altitude_10am = 32  # degrees
    shadow_10am = object_height / math.tan(math.radians(test_altitude_10am))
    print(f"태양 고도 {test_altitude_10am}°일 때:")
    print(f"예상 그림자 길이: {shadow_10am:.2f}m")
    print(f"물체 높이 대비: {shadow_10am/object_height:.2f}배")
    
    # Check for noon case
    print(f"\n=== 정오 예상 값 ===")
    # Typical sun altitude for Seoul Oct 30 at noon: ~40-45 degrees
    test_altitude_noon = 42  # degrees
    shadow_noon = object_height / math.tan(math.radians(test_altitude_noon))
    print(f"태양 고도 {test_altitude_noon}°일 때:")
    print(f"예상 그림자 길이: {shadow_noon:.2f}m")
    print(f"물체 높이 대비: {shadow_noon/object_height:.2f}배")

if __name__ == "__main__":
    verify_shadow_calculation()

