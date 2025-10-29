"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class Location(BaseModel):
    """Location coordinates"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    lon: float = Field(..., ge=-180, le=180, description="Longitude in degrees")
    altitude: Optional[float] = Field(0, ge=0, description="Altitude in meters")
    timezone: Optional[str] = Field(None, description="IANA timezone (e.g., 'Asia/Seoul')")

class DateTimeRange(BaseModel):
    """Date and time range"""
    date: str = Field(..., description="Date in ISO 8601 format (YYYY-MM-DD)")
    start_time: Optional[str] = Field(None, description="Start time (HH:MM)")
    end_time: Optional[str] = Field(None, description="End time (HH:MM)")
    interval: Optional[int] = Field(60, ge=1, le=1440, description="Time interval in minutes")
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v):
        """Validate date format"""
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("Date must be in ISO 8601 format (YYYY-MM-DD)")

class ObjectProperties(BaseModel):
    """Physical object properties"""
    height: float = Field(..., gt=0, le=1000, description="Object height in meters")
    tilt: Optional[float] = Field(0, ge=0, le=90, description="Tilt angle in degrees")
    azimuth: Optional[float] = Field(0, ge=0, lt=360, description="Azimuth angle in degrees")

class CalculationOptions(BaseModel):
    """Calculation options"""
    atmosphere: bool = Field(True, description="Apply atmospheric refraction correction")
    precision: str = Field("medium", description="Calculation precision: low, medium, high")
    include_weather: bool = Field(False, description="Include weather data")

class SolarCalculationRequest(BaseModel):
    """Solar calculation request"""
    location: Location
    datetime: DateTimeRange
    object: Optional[ObjectProperties] = None
    options: Optional[CalculationOptions] = CalculationOptions()

class SunPosition(BaseModel):
    """Sun position at a specific time"""
    altitude: float = Field(..., description="Solar altitude in degrees")
    azimuth: float = Field(..., description="Solar azimuth in degrees")
    zenith: float = Field(..., description="Solar zenith angle in degrees")
    hour_angle: Optional[float] = Field(None, description="Hour angle in degrees")

class Irradiance(BaseModel):
    """Solar irradiance values"""
    ghi: float = Field(..., description="Global Horizontal Irradiance (W/m²)")
    dni: float = Field(..., description="Direct Normal Irradiance (W/m²)")
    dhi: float = Field(..., description="Diffuse Horizontal Irradiance (W/m²)")
    par: Optional[float] = Field(None, description="Photosynthetically Active Radiation (W/m²)")

class Shadow(BaseModel):
    """Shadow properties"""
    length: Optional[float] = Field(None, description="Shadow length in meters (None if not applicable)")
    direction: Optional[float] = Field(None, description="Shadow direction in degrees (may be None when sun below horizon)")
    coordinates: Optional[List[List[float]]] = Field(None, description="Shadow line coordinates [[lon1, lat1], [lon2, lat2]]. None when sun is below horizon or shadow is infinite.")

class SolarDataPoint(BaseModel):
    """Solar data at a specific timestamp"""
    timestamp: str
    sun: SunPosition
    irradiance: Optional[Irradiance] = None
    shadow: Optional[Shadow] = None

class SolarSummary(BaseModel):
    """Summary of solar calculations"""
    sunrise: str
    sunset: str
    solar_noon: str
    day_length: float = Field(..., description="Day length in hours")
    max_altitude: float = Field(..., description="Maximum solar altitude in degrees")
    total_irradiance: Optional[float] = Field(None, description="Total daily irradiance (kWh/m²)")

class Accuracy(BaseModel):
    """Calculation accuracy metrics"""
    position: float = Field(..., description="Position accuracy in degrees")
    irradiance: float = Field(..., description="Irradiance accuracy as percentage")

class Metadata(BaseModel):
    """Response metadata"""
    request_id: str
    timestamp: str
    version: str
    accuracy: Accuracy

class SolarCalculationResponse(BaseModel):
    """Complete solar calculation response"""
    metadata: Metadata
    summary: SolarSummary
    series: List[SolarDataPoint]
