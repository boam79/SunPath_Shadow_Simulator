"""
Integrated API - combines solar position, shadow, and irradiance calculations
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import asyncio
import time

from app.models.schemas import (
    SolarCalculationRequest,
    SolarCalculationResponse,
    BatchCalculationRequest,
    BatchCalculationResponse,
    BatchCalculationResponseItem,
)
from app.services.optimizer import OptimizationService
from app.services.integrated_calculation_service import run_integrated_calculation

router = APIRouter()
optimizer = OptimizationService()


@router.post("/calculate", response_model=SolarCalculationResponse)
async def calculate_all(request: SolarCalculationRequest) -> SolarCalculationResponse:
    """
    통합 계산: 태양 위치 + 그림자 + 일사량
    """
    try:
        return await asyncio.to_thread(run_integrated_calculation, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        ) from e
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Missing data column: {str(e)}",
        ) from e
    except Exception as e:
        print(f"❌ Unexpected error in calculate_all: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error: {type(e).__name__}",
        ) from e


@router.post("/batch", response_model=BatchCalculationResponse)
async def calculate_batch(request: BatchCalculationRequest) -> BatchCalculationResponse:
    """배치 계산: 동일 파이프라인을 요청별로 실행."""
    start_time = time.time()
    total_requests = len(request.requests)

    async def process_single_request(req: SolarCalculationRequest, index: int) -> BatchCalculationResponseItem:
        try:
            result = await asyncio.to_thread(run_integrated_calculation, req)
            return BatchCalculationResponseItem(
                index=index,
                success=True,
                result=result,
                error=None,
            )
        except Exception as e:
            return BatchCalculationResponseItem(
                index=index,
                success=False,
                result=None,
                error=str(e),
            )

    try:
        if request.parallel and total_requests > 1:
            tasks = [process_single_request(req, idx) for idx, req in enumerate(request.requests)]
            results = await asyncio.gather(*tasks)
        else:
            results = []
            for idx, req in enumerate(request.requests):
                results.append(await process_single_request(req, idx))

        successful = sum(1 for r in results if r.success)
        failed = total_requests - successful
        processing_time_ms = (time.time() - start_time) * 1000

        return BatchCalculationResponse(
            total_requests=total_requests,
            successful=successful,
            failed=failed,
            processing_time_ms=round(processing_time_ms, 2),
            results=results,
        )

    except Exception as e:
        print(f"❌ Error in calculate_batch: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch calculation error: {type(e).__name__}",
        ) from e


@router.post("/optimize")
async def optimize_periods(response: SolarCalculationResponse) -> Dict[str, Any]:
    """통합 계산 결과에서 최적 시간대 분석."""
    try:
        series_data = []
        for point in response.series:
            point_dict = {
                "timestamp": point.timestamp,
                "sun": {
                    "altitude": point.sun.altitude,
                    "azimuth": point.sun.azimuth,
                    "zenith": point.sun.zenith,
                    "hour_angle": point.sun.hour_angle,
                },
                "irradiance": {
                    "ghi": point.irradiance.ghi if point.irradiance else None,
                    "dni": point.irradiance.dni if point.irradiance else None,
                    "dhi": point.irradiance.dhi if point.irradiance else None,
                    "par": point.irradiance.par if point.irradiance else None,
                }
                if point.irradiance
                else None,
                "shadow": {
                    "length": point.shadow.length if point.shadow else None,
                    "direction": point.shadow.direction if point.shadow else None,
                    "coordinates": point.shadow.coordinates if point.shadow else None,
                }
                if point.shadow
                else None,
            }
            series_data.append(point_dict)

        optimization_result = optimizer.analyze_optimal_periods(series_data)

        return {
            "status": "success",
            "optimization": optimization_result,
        }

    except Exception as e:
        print(f"❌ Error in optimize_periods: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization error: {type(e).__name__}",
        ) from e
