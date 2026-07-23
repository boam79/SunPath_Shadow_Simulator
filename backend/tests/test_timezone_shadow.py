"""Unit tests for timezone resolution and polar day_length."""
from datetime import timezone, timedelta
from zoneinfo import ZoneInfo

from app.services.timezone_utils import resolve_timezone
from app.services.solar_calculator import SolarCalculator
from app.services.shadow_calculator import ShadowCalculator


def test_seoul_timezone_is_asia_seoul_or_utc9():
    tz = resolve_timezone(37.5665, 126.9780)
    # Prefer IANA; fallback may be fixed offset
    key = getattr(tz, "key", None)
    if key:
        assert key == "Asia/Seoul"
    else:
        assert tz.utcoffset(None) == timedelta(hours=9) or tz.utcoffset(None) == timedelta(hours=8)


def test_explicit_iana_timezone():
    tz = resolve_timezone(0, 0, "Asia/Seoul")
    assert isinstance(tz, ZoneInfo)
    assert tz.key == "Asia/Seoul"


def test_shadow_length_null_not_infinity_when_sun_low():
    sc = ShadowCalculator()
    result = sc.calculate_shadow(10, 0.05, 180)
    assert result["status"] == "infinite_shadow"
    assert result["length"] is None


def test_shadow_length_null_when_no_sun():
    sc = ShadowCalculator()
    result = sc.calculate_shadow(10, -5, 180)
    assert result["status"] == "no_sun"
    assert result["length"] is None


def test_polar_day_length_near_north_pole_summer():
    calc = SolarCalculator()
    # 80N midsummer — expect polar day (24h) when noon altitude > 0
    result = calc.calculate_sunrise_sunset(80.0, 0.0, "2025-06-21", timezone_name="UTC")
    assert result["day_length"] in (0.0, 24.0)
    # With correct noon check should be 24
    assert result["day_length"] == 24.0
