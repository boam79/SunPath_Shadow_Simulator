"""
Redis client and cache utilities
"""
import redis
import json
import hashlib
from typing import Any, Optional, Dict
from functools import wraps
from app.core.config import settings

class RedisClient:
    """Redis client singleton"""

    _instance = None
    _client = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize once
        if RedisClient._initialized:
            return

        RedisClient._initialized = True
        try:
            self._client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self._client.ping()
            print(f"✅ Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except redis.ConnectionError as e:
            print(f"⚠️ Redis connection failed: {e}")
            print("   Continuing without cache...")
            self._client = None
        except Exception as e:
            print(f"⚠️ Redis initialization error: {e}")
            self._client = None
    
    @property
    def client(self) -> Optional[redis.Redis]:
        """Get Redis client instance"""
        return self._client
    
    def is_available(self) -> bool:
        """Check if Redis is available"""
        if self._client is None:
            return False
        try:
            self._client.ping()
            return True
        except (redis.ConnectionError, redis.TimeoutError):
            return False
        except Exception as e:
            print(f"⚠️ Unexpected Redis error: {e}")
            return False

class CacheManager:
    """Cache management utilities"""
    
    def __init__(self):
        self.redis_client = RedisClient()
        self.default_ttl = settings.REDIS_CACHE_TTL
        self.stats = {
            'hits': 0,
            'misses': 0,
            'errors': 0
        }
    
    def generate_cache_key(
        self,
        prefix: str,
        lat: float,
        lon: float,
        date: str,
        **kwargs
    ) -> str:
        """
        Generate cache key with consistent format
        
        Args:
            prefix: Key prefix (e.g., 'solar', 'shadow', 'irradiance')
            lat: Latitude
            lon: Longitude
            date: Date string
            **kwargs: Additional parameters to include in key
            
        Returns:
            Cache key string
        """
        # Use full precision coordinates for accuracy (up to 6 decimal places ≈ 0.1m)
        lat_str = f"{lat:.6f}".rstrip('0').rstrip('.')
        lon_str = f"{lon:.6f}".rstrip('0').rstrip('.')
        
        # Build key components
        key_parts = [
            prefix,
            f"lat:{lat_str}",
            f"lon:{lon_str}",
            f"date:{date}"
        ]
        
        # Add optional parameters
        for key, value in sorted(kwargs.items()):
            if value is not None:
                key_parts.append(f"{key}:{value}")
        
        # Create hash for long keys
        key_string = "_".join(map(str, key_parts))
        
        # If key is too long, use hash
        if len(key_string) > 200:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"{prefix}:{key_hash}"
        
        return key_string
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if not self.redis_client.is_available():
            return None
        
        try:
            value = self.redis_client.client.get(key)
            if value:
                self.stats['hits'] += 1
                return json.loads(value)
            else:
                self.stats['misses'] += 1
                return None
        except Exception as e:
            self.stats['errors'] += 1
            print(f"Cache get error: {e}")
            return None
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: int = None
    ) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default: REDIS_CACHE_TTL)
            
        Returns:
            Success status
        """
        if not self.redis_client.is_available():
            return False
        
        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value)
            self.redis_client.client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            self.stats['errors'] += 1
            print(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis_client.is_available():
            return False
        
        try:
            self.redis_client.client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """
        Clear keys matching pattern
        
        Args:
            pattern: Pattern with wildcards (e.g., 'solar:*')
            
        Returns:
            Number of keys deleted
        """
        if not self.redis_client.is_available():
            return 0
        
        try:
            keys = self.redis_client.client.keys(pattern)
            if keys:
                return self.redis_client.client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache clear error: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        info = {}
        if self.redis_client.is_available():
            try:
                redis_info = self.redis_client.client.info('stats')
                info = {
                    'total_connections': redis_info.get('total_connections_received', 0),
                    'total_commands': redis_info.get('total_commands_processed', 0),
                    'keyspace_hits': redis_info.get('keyspace_hits', 0),
                    'keyspace_misses': redis_info.get('keyspace_misses', 0)
                }
            except:
                pass
        
        return {
            'available': self.redis_client.is_available(),
            'session_stats': {
                'hits': self.stats['hits'],
                'misses': self.stats['misses'],
                'errors': self.stats['errors'],
                'hit_rate': f"{hit_rate:.2f}%"
            },
            'redis_info': info
        }

# Global cache manager instance
cache_manager = CacheManager()

def cached(
    prefix: str,
    ttl: int = None,
    include_params: list = None
):
    """
    Decorator for caching function results
    
    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds
        include_params: List of parameter names to include in cache key
    
    Usage:
        @cached(prefix='solar', include_params=['lat', 'lon', 'date'])
        async def calculate_solar_position(lat, lon, date):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract parameters for cache key
            cache_params = {}
            if include_params:
                for param in include_params:
                    if param in kwargs:
                        cache_params[param] = kwargs[param]
            
            # Generate cache key
            if 'lat' in cache_params and 'lon' in cache_params and 'date' in cache_params:
                cache_key = cache_manager.generate_cache_key(
                    prefix=prefix,
                    lat=cache_params['lat'],
                    lon=cache_params['lon'],
                    date=cache_params['date'],
                    **{k: v for k, v in cache_params.items() if k not in ['lat', 'lon', 'date']}
                )
                
                # Try to get from cache
                cached_value = cache_manager.get(cache_key)
                if cached_value is not None:
                    print(f"🎯 Cache HIT: {cache_key}")
                    return cached_value
                
                print(f"💾 Cache MISS: {cache_key}")
            else:
                cache_key = None
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            if cache_key and result:
                cache_manager.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator
