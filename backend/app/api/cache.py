"""
Cache management API endpoints
"""
from fastapi import APIRouter, HTTPException, status, Header
from typing import Dict, Any, Optional

from app.core.redis_client import cache_manager
from app.core.config import settings

router = APIRouter()

@router.get("/stats")
async def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics
    
    **제공 정보:**
    - Redis 연결 상태
    - 캐시 히트/미스 통계
    - 히트율
    - Redis 서버 통계
    """
    try:
        stats = cache_manager.get_stats()
        return {
            'cache_status': 'active' if stats['available'] else 'unavailable',
            'statistics': stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting cache stats: {str(e)}"
        )

@router.post("/clear")
async def clear_cache(
    pattern: str = "*",
    x_cache_admin_token: Optional[str] = Header(None, alias="X-Cache-Admin-Token"),
) -> Dict[str, Any]:
    """
    Clear cache entries matching pattern.

    Requires header ``X-Cache-Admin-Token`` matching ``CACHE_ADMIN_TOKEN`` env.
    If ``CACHE_ADMIN_TOKEN`` is unset, this endpoint returns 403.

    **패턴 예시:**
    - `*`: 모든 캐시 삭제
    - `solar:*`: Solar 관련 캐시만 삭제
    - `integrated:*`: 통합 계산 캐시만 삭제
    """
    try:
        expected = (settings.CACHE_ADMIN_TOKEN or "").strip()
        if not expected or x_cache_admin_token != expected:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cache clear requires valid X-Cache-Admin-Token",
            )

        if not pattern or len(pattern) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid pattern: must be 1-100 characters"
            )

        deleted_count = cache_manager.clear_pattern(pattern)
        return {
            'message': f'Cleared {deleted_count} cache entries',
            'pattern': pattern,
            'deleted_count': deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing cache: {str(e)}"
        )

@router.get("/test")
async def test_cache_performance() -> Dict[str, Any]:
    """
    Test cache performance with sample data
    """
    import time
    
    try:
        test_data = {
            'test': True,
            'timestamp': time.time()
        }
        
        # Test set
        start = time.time()
        cache_manager.set('cache:test:perf', test_data, ttl=60)
        set_time = (time.time() - start) * 1000
        
        # Test get
        start = time.time()
        result = cache_manager.get('cache:test:perf')
        get_time = (time.time() - start) * 1000
        
        # Cleanup
        cache_manager.delete('cache:test:perf')
        
        return {
            'status': 'ok' if result else 'miss',
            'set_ms': round(set_time, 2),
            'get_ms': round(get_time, 2),
            'available': cache_manager.redis_client.is_available()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cache test error: {str(e)}"
        )
