"""策略6：最佳時機預測 (STUB)

邏輯：
1. 自己累積的歷史票價資料庫（PostgreSQL）
2. 對同一條航線，計算 30/60/90 天前票價 vs 現在票價
3. 預測：「現在買 vs 等 N 天再買」哪個更便宜
4. 輸出置信度（高/中/低）

Phase 1: Stub 回應
Phase 2: 替換真實 PostgreSQL + 預測演算法
"""

import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.types import AnalyzeRequest, TimingResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["strategy-6-timing"])


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================


class TimingResponse(BaseModel):
    """最佳時機預測回應"""
    success: bool
    origin: str
    destination: str
    current_price: float
    price_trend: str  # "rising" | "falling" | "stable"
    prediction: str
    confidence: str  # "high" | "medium" | "low"
    recommendation: str


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/timing",
    response_model=TimingResponse,
    summary="策略6：最佳時機預測 (Phase 2)",
    description="預測未來票價走势，給出最佳購買時機建議（Phase 2 功能）",
)
async def analyze_timing(request: AnalyzeRequest) -> TimingResponse:
    """最佳時機預測（Phase 1 Stub）

    Args:
        request: AnalyzeRequest，包含 origin, destination

    Returns:
        TimingResponse: 時機預測結果

    Note:
        Phase 1: 回傳 stub 資料
        Phase 2: 連結 PostgreSQL 歷史資料庫進行真實預測
    """
    logger.warning(
        f"[Strategy-6] Timing analysis called (STUB): "
        f"{request.origin} -> {request.destination}"
    )

    # 參數驗證
    if not request.origin or len(request.origin) != 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid origin IATA code",
        )
    if not request.destination or len(request.destination) != 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid destination IATA code",
        )

    # Phase 1: 回傳 stub 資料
    # Phase 2: 連結 PostgreSQL + ML 模型
    response = TimingResponse(
        success=True,
        origin=request.origin.upper(),
        destination=request.destination.upper(),
        current_price=0.0,
        price_trend="stable",
        prediction="Phase 2 開放",
        confidence="low",
        recommendation="時機預測功能將於 Phase 2 啟用，敬請期待",
    )

    logger.info(f"[Strategy-6] Stub response returned for {request.origin} -> {request.destination}")

    return response