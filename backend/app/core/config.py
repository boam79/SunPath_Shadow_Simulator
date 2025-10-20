"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SunPath & Shadow Simulator"
    VERSION: str = "0.1.0"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_CACHE_TTL: int = 21600  # 6 hours
    
    # Calculation Settings
    DEFAULT_PRESSURE: float = 1013.25  # Standard atmospheric pressure (mbar)
    DEFAULT_TEMPERATURE: float = 15.0   # Standard temperature (°C)
    MAX_OBJECT_HEIGHT: float = 1000.0   # Maximum object height (meters)
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
