"""
Resolve IANA / fixed-offset timezones for solar calculations.
Prefer explicit IANA → timezonefinder (optional) → longitude/15 fallback.
"""
from __future__ import annotations

from datetime import timedelta, timezone
from typing import Any, Optional, Union
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

TzLike = Union[ZoneInfo, timezone]

_tf = None
_tf_tried = False


def _get_timezonefinder():
    global _tf, _tf_tried
    if _tf_tried:
        return _tf
    _tf_tried = True
    try:
        from timezonefinder import TimezoneFinder

        _tf = TimezoneFinder()
    except Exception as e:
        print(f"⚠️ timezonefinder unavailable ({e}); using lon/15 fallback when IANA missing")
        _tf = None
    return _tf


def resolve_timezone(
    latitude: float,
    longitude: float,
    iana: Optional[str] = None,
) -> TzLike:
    """
    Resolve a tzinfo for civil local time at a location.

    Args:
        latitude: degrees
        longitude: degrees
        iana: optional IANA name (e.g. Asia/Seoul)
    """
    if iana:
        try:
            return ZoneInfo(iana)
        except ZoneInfoNotFoundError:
            print(f"⚠️ Unknown IANA timezone '{iana}'; falling back to lookup")

    tf = _get_timezonefinder()
    if tf is not None:
        try:
            name = tf.timezone_at(lng=longitude, lat=latitude)
            if name:
                return ZoneInfo(name)
        except Exception as e:
            print(f"⚠️ timezonefinder lookup failed: {e}")

    # Last resort: approximate solar time zones (not political)
    offset_hours = int(round(longitude / 15.0))
    offset_hours = max(-12, min(14, offset_hours))
    return timezone(timedelta(hours=offset_hours))


def timezone_label(tz: Any) -> str:
    """Human-readable label for logs / metadata."""
    key = getattr(tz, "key", None)
    if key:
        return str(key)
    utcoffset = getattr(tz, "utcoffset", None)
    if callable(utcoffset):
        delta = utcoffset(None)
        if delta is not None:
            hours = int(delta.total_seconds() // 3600)
            return f"UTC{hours:+d}"
    return "UTC"
