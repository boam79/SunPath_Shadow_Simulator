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
    altitude = request.location.altitude if request.location.altitude is not None else 0
    timezone_name = request.location.timezone

    date = request.datetime.date
    start_time = request.datetime.start_time or "00:00"
    end_time = request.datetime.end_time or "23:59"
    interval = request.datetime.interval or 60

    object_height = request.object.height if request.object else None
    surface_tilt = request.object.tilt if request.object else None
    surface_azimuth = request.object.azimuth if request.object else None
    apply_refraction = request.options.atmosphere if request.options else True
    precision = request.options.precision if request.options else "medium"
    poa_sky_model = (
        request.options.sky_model if request.options and request.options.sky_model else "isotropic"
    )
    if poa_sky_model not in ("isotropic", "perez", "klucher"):
        poa_sky_model = "isotropic"
    # Clear-sky horizontal model stays Ineichen; sky_model applies to POA diffuse
    clear_sky_model = "ineichen"

    cache_key = cache_manager.generate_cache_key(
        prefix="integrated",
        lat=lat,
        lon=lon,
        date=date,
        start=start_time,
        end=end_time,
        interval=interval,
        height=object_height,
        altitude=altitude,
        tz=timezone_name or "",
        atmosphere=apply_refraction,
        precision=precision,
        model=clear_sky_model,
        sky=poa_sky_model,
        tilt=surface_tilt if surface_tilt is not None else "",
        saz=surface_azimuth if surface_azimuth is not None else "",
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
        model=clear_sky_model,
        timezone_name=timezone_name,
        apply_refraction=apply_refraction,
    )

    daily_totals = _irradiance.calculate_daily_total_irradiance(
        irradiance_data=irradiance_data,
        interval_minutes=interval,
    )

    sun_times = _solar.calculate_sunrise_sunset(
        lat, lon, date, timezone_name=timezone_name
    )
    max_altitude = _solar.get_max_solar_altitude(
        irradiance_data, apply_refraction=apply_refraction
    )

    alt_col = "apparent_elevation" if apply_refraction else "elevation"
    zen_col = "apparent_zenith" if apply_refraction else "zenith"
    if alt_col not in irradiance_data.columns:
        alt_col = "apparent_elevation"
    if zen_col not in irradiance_data.columns:
        zen_col = "apparent_zenith"

    series_data = []
    for idx, row in irradiance_data.iterrows():
        sun_alt = _safe_number(row[alt_col])
        sun_azi = _safe_number(row["azimuth"])
        sun_zen = _safe_number(row[zen_col])

        ghi = _safe_number(row["ghi"])
        dni = _safe_number(row["dni"])
        dhi = _safe_number(row["dhi"])
        par_val = _safe_number(_irradiance.calculate_par(row["ghi"]))

        hour_angle = _solar._calculate_hour_angle(idx, sun_azi or 0)

        poa_val = None
        if (
            surface_tilt is not None
            and surface_tilt > 0
            and ghi is not None
            and dni is not None
            and dhi is not None
            and sun_zen is not None
            and sun_azi is not None
        ):
            try:
                poa = _irradiance.calculate_poa_irradiance(
                    ghi=ghi,
                    dni=dni,
                    dhi=dhi,
                    solar_zenith=sun_zen,
                    solar_azimuth=sun_azi,
                    surface_tilt=float(surface_tilt),
                    surface_azimuth=float(surface_azimuth or 180.0),
                    sky_model=poa_sky_model,
                )
                poa_val = _safe_number(poa.get("poa_global"))
            except Exception:
                poa_val = None

        data_point = {
            "timestamp": idx.isoformat(),
            "sun": {
                # Pydantic SunPosition requires float — coerce missing to 0
                "altitude": sun_alt if sun_alt is not None else 0.0,
                "azimuth": sun_azi if sun_azi is not None else 0.0,
                "zenith": sun_zen if sun_zen is not None else 90.0,
                "hour_angle": hour_angle,
            },
            "irradiance": {
                "ghi": ghi if ghi is not None else 0.0,
                "dni": dni if dni is not None else 0.0,
                "dhi": dhi if dhi is not None else 0.0,
                "par": par_val,
                "poa": poa_val,
            },
        }

        if request.object and request.object.height:
            shadow_result = _shadow.calculate_shadow(
                object_height=request.object.height,
                sun_altitude=row[alt_col],
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
                None
                if shadow_result["length"] is None
                or (
                    isinstance(shadow_result["length"], float)
                    and math.isinf(shadow_result["length"])
                )
                else _safe_number(shadow_result["length"])
            )
            direction_val = (
                shadow_result["direction"] if shadow_result["direction"] is not None else None
            )

            polygon = None
            if (
                length_val is not None
                and direction_val is not None
                and shadow_result["status"] == "normal"
            ):
                try:
                    width = max(1.0, float(request.object.height) * 0.4)
                    polygon = _shadow.calculate_shadow_polygon(
                        center_lat=lat,
                        center_lon=lon,
                        object_height=float(request.object.height),
                        object_width=width,
                        shadow_length=float(length_val),
                        shadow_direction=float(direction_val),
                    )
                except Exception:
                    polygon = None

            data_point["shadow"] = {
                "length": length_val,
                "direction": direction_val,
                "coordinates": [[lon, lat], [end_lon, end_lat]]
                if (end_lon is not None and end_lat is not None)
                else None,
                "polygon": polygon,
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
