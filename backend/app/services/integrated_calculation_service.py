"""
통합 계산(일사·태양·그림자) 파이프라인 — 라우터에서 분리.
배치 API의 process_single_request_sync 와 동일 로직을 단일 함수로 제공.
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime

from app.models.schemas import (
    SolarCalculationRequest,
    SolarCalculationResponse,
    Metadata,
    Accuracy,
    SolarSummary,
)
from app.services.solar_calculator import SolarCalculator
from app.services.shadow_calculator import ShadowCalculator
from app.services.irradiance_calculator import IrradianceCalculator
from app.core.redis_client import cache_manager
from app.core.config import settings

_solar = SolarCalculator()
_shadow = ShadowCalculator()
_irradiance = IrradianceCalculator()


def _safe_number(value: float):
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def run_integrated_calculation(request: SolarCalculationRequest) -> SolarCalculationResponse:
    """캐시 조회 → 미스 시 계산 → 캐시 저장 후 응답."""
    lat = request.location.lat
    lon = request.location.lon
    altitude = request.location.altitude or 0

    date = request.datetime.date
    start_time = request.datetime.start_time or "00:00"
    end_time = request.datetime.end_time or "23:59"
    interval = request.datetime.interval or 60

    object_height = request.object.height if request.object else None

    cache_key = cache_manager.generate_cache_key(
        prefix="integrated",
        lat=lat,
        lon=lon,
        date=date,
        start=start_time,
        end=end_time,
        interval=interval,
        height=object_height,
    )

    cached_result = cache_manager.get(cache_key)
    if cached_result:
        print(f"🎯 Cache HIT: {cache_key}")
        return SolarCalculationResponse(**cached_result)

    irradiance_data = _irradiance.calculate_clear_sky_irradiance(
        latitude=lat,
        longitude=lon,
        date=date,
        start_time=start_time,
        end_time=end_time,
        interval_minutes=interval,
        altitude=altitude,
        model="ineichen",
    )

    daily_totals = _irradiance.calculate_daily_total_irradiance(
        irradiance_data=irradiance_data,
        interval_minutes=interval,
    )

    sun_times = _solar.calculate_sunrise_sunset(lat, lon, date)
    max_altitude = _solar.get_max_solar_altitude(irradiance_data)

    series_data = []
    for idx, row in irradiance_data.iterrows():
        sun_alt = _safe_number(row["apparent_elevation"])
        sun_azi = _safe_number(row["azimuth"])
        sun_zen = _safe_number(row["apparent_zenith"])

        ghi = _safe_number(row["ghi"])
        dni = _safe_number(row["dni"])
        dhi = _safe_number(row["dhi"])
        par_val = _safe_number(_irradiance.calculate_par(row["ghi"]))

        data_point = {
            "timestamp": idx.isoformat(),
            "sun": {
                "altitude": sun_alt,
                "azimuth": sun_azi,
                "zenith": sun_zen,
                "hour_angle": 0,
            },
            "irradiance": {
                "ghi": ghi,
                "dni": dni,
                "dhi": dhi,
                "par": par_val,
            },
        }

        if request.object and request.object.height:
            shadow_result = _shadow.calculate_shadow(
                object_height=request.object.height,
                sun_altitude=row["apparent_elevation"],
                sun_azimuth=row["azimuth"],
            )

            end_lat, end_lon = None, None
            if shadow_result["status"] == "normal":
                end_lat, end_lon = _shadow.calculate_shadow_endpoint(
                    start_lat=lat,
                    start_lon=lon,
                    shadow_length=shadow_result["length"],
                    shadow_direction=shadow_result["direction"],
                )

            length_val = (
                None if math.isinf(shadow_result["length"]) else _safe_number(shadow_result["length"])
            )
            direction_val = shadow_result["direction"] if shadow_result["direction"] is not None else None

            data_point["shadow"] = {
                "length": length_val,
                "direction": direction_val,
                "coordinates": [[lon, lat], [end_lon, end_lat]]
                if (end_lon is not None and end_lat is not None)
                else None,
            }
        else:
            data_point["shadow"] = None

        series_data.append(data_point)

    response = SolarCalculationResponse(
        metadata=Metadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow().isoformat(),
            version="0.1.0",
            accuracy=Accuracy(position=0.05, irradiance=5.0),
        ),
        summary=SolarSummary(
            sunrise=sun_times["sunrise"] or "N/A",
            sunset=sun_times["sunset"] or "N/A",
            solar_noon=sun_times["solar_noon"] or "N/A",
            day_length=sun_times["day_length"],
            max_altitude=max_altitude,
            total_irradiance=daily_totals["ghi"],
        ),
        series=series_data,
    )

    print(f"💾 Cache MISS: {cache_key} - Storing result")
    cache_manager.set(cache_key, response.model_dump(), ttl=settings.REDIS_CACHE_TTL)

    return response
