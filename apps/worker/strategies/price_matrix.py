"""策略4：多點拆分計算

邏輯：
1. 接收起點→終點（如 TPE→FCO）
2. 測試分段購買：A→B, B→C vs A→C
3. 計算總價差，找出更便宜的路線

Phase 1: Mock fallback 回應
Phase 2: 替換真實 API 呼叫
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.types import AnalyzeRequest, PriceMatrixResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["strategy-4-price-matrix"])


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================


class PriceSegmentResponse(BaseModel):
    """票價分段"""
    origin: str
    destination: str
    price: float
    currency: str = "USD"
    airline: Optional[str] = None


class PriceMatrixResponse(BaseModel):
    """多點拆分計算回應"""
    success: bool
    origin: str
    destination: str
    direct_price: float
    segmented_price: float
    segments: list[PriceSegmentResponse]
    savings_twd: float
    recommendation: str


# ============================================================================
# Mock Data & Logic (Phase 1)
# ============================================================================

# 常見航線分段組合
SPLIT_ROUTES: dict[str, list[tuple[str, str, str]]] = {
    "TPEFCO": [("TPE", "IST", "FCO"), ("TPE", "DXB", "FCO")],  # TPE -> FCO 可經伊斯坦堡或杜拜
    "TPELAX": [("TPE", "NRT", "LAX"), ("TPE", "ICN", "LAX")],  # TPE -> LAX 可經東京或首爾
    "HKGJFK": [("HKG", "LAX", "JFK"), ("HKG", "ORD", "JFK")],  # HKG -> JFK
    "SYDJFK": [("SYD", "LAX", "JFK"), ("SYD", "HNL", "JFK")],  # SYD -> JFK
}


def _get_split_key(origin: str, destination: str) -> str:
    """取得分段路由的 key"""
    return f"{origin[:3]}{destination[:3]}"


def _calculate_mock_split_prices(
    origin: str, destination: str
) -> tuple[float, float, list[PriceSegmentResponse]]:
    """計算分段票價（Mock）

    Returns:
        (直飛價格, 分段價格, 分段清單)
    """
    import random
    random.seed(hash(f"{origin}{destination}") % (2**32))

    # 嘗試找到分段路由
    key = _get_split_key(origin, destination)
    split_options = SPLIT_ROUTES.get(key, [])

    if not split_options:
        # 沒有預設分段，使用通用計算
        direct_price = 800 + random.uniform(0, 400)
        # 分段通常是直飛的 70-90%
        split_factor = 0.75 + random.uniform(0, 0.1)
        segmented_price = direct_price * split_factor

        segments = [
            PriceSegmentResponse(
                origin=origin,
                destination=destination,
                price=direct_price,
                airline="Mock Airlines",
            )
        ]
        return round(direct_price, 2), round(segmented_price, 2), segments

    # 使用第一個分段選項
    seg1, seg2 = split_options[0]
    price1 = 300 + random.uniform(100, 200)
    price2 = 400 + random.uniform(100, 300)

    segments = [
        PriceSegmentResponse(origin=seg1[0], destination=seg1[1], price=round(price1, 2)),
        PriceSegmentResponse(origin=seg1[1], destination=seg1[2], price=round(price2, 2)),
    ]

    total_split = price1 + price2
    # 直飛通常比分段貴
    direct_price = total_split * (1.1 + random.uniform(0, 0.2))

    return round(direct_price, 2), round(total_split, 2), segments


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/price-matrix",
    response_model=PriceMatrixResponse,
    summary="策略4：多點拆分計算",
    description="測試分段購買是否能節省機票費用",
)
async def analyze_price_matrix(request: AnalyzeRequest) -> PriceMatrixResponse:
    """多點拆分票價計算

    Args:
        request: AnalyzeRequest，包含 origin, destination

    Returns:
        PriceMatrixResponse: 分段票價分析結果
    """
    logger.info(
        f"[Strategy-4] Price matrix: {request.origin} -> {request.destination}"
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

    origin = request.origin.upper()
    destination = request.destination.upper()

    # Phase 1: Mock 計算
    # Phase 2: 呼叫 Travelpayouts prices-matrix API
    direct_price, segmented_price, segments = _calculate_mock_split_prices(
        origin, destination
    )

    # 計算節省金額
    savings = direct_price - segmented_price
    usd_to_twd = 31
    savings_twd = round(savings * usd_to_twd, 2)

    # 建立推薦
    if savings > 0:
        recommendation = (
            f"分段購買可省 {savings_twd:.0f} 元 "
            f"(USD {savings:.0f})，建議分段航程"
        )
    else:
        recommendation = "直飛價格較優，建議直接購買"

    response = PriceMatrixResponse(
        success=True,
        origin=origin,
        destination=destination,
        direct_price=direct_price,
        segmented_price=segmented_price,
        segments=segments,
        savings_twd=savings_twd,
        recommendation=recommendation,
    )

    logger.info(
        f"[Strategy-4] Complete: direct=${direct_price}, "
        f"split=${segmented_price}, savings={savings_twd} TWD"
    )

    return response