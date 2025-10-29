"""
Cache management API endpoints
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any

from app.core.redis_client import cache_manager

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
    pattern: str = "*"
) -> Dict[str, Any]:
    """
    Clear cache entries matching pattern

    **패턴 예시:**
    - `*`: 모든 캐시 삭제
    - `solar:*`: Solar 관련 캐시만 삭제
    - `integrated:*`: 통합 계산 캐시만 삭제

    **⚠️ WARNING:** This endpoint should be protected with authentication in production!
    **보안 주의:** 프로덕션 환경에서는 반드시 인증을 추가해야 합니다!
    """
    try:
        # TODO: Add authentication check for production
        # Example: verify_admin_token(request)

        # Pattern validation
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
            'test': 'cache_performance',
            'timestamp': time.time()
        }
        
        # Test set
        test_key = 'test:performance:key'
        start = time.time()
        cache_manager.set(test_key, test_data, ttl=60)
        set_time = (time.time() - start) * 1000  # ms
        
        # Test get
        start = time.time()
        retrieved = cache_manager.get(test_key)
        get_time = (time.time() - start) * 1000  # ms
        
        # Clean up
        cache_manager.delete(test_key)
        
        return {
            'redis_available': cache_manager.redis_client.is_available(),
            'performance': {
                'set_time_ms': f'{set_time:.2f}',
                'get_time_ms': f'{get_time:.2f}',
                'target_get_time': '<100ms'
            },
            'data_integrity': retrieved == test_data,
            'status': '✅ PASS' if get_time < 100 and retrieved == test_data else '⚠️ WARNING'
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'status': 'Test failed'
        }
