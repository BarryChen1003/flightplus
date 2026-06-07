"""策略5：替代樞紐戰術

邏輯：
1. 找目的地周圍的主要轉運樞紐（如 NRT 可以用 ICN、NGO、HND 作為替代）
2. 計算：直飛 vs 飛到替代樞紐再轉的總價
3. 輸出「建議轉運點」

Phase 1: Mock fallback 回應
Phase 2: 替換真實 API 呼叫
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.types import AnalyzeRequest, HubTacticsResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["strategy-5-hub-tactics"])


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================


class HubOptionResponse(BaseModel):
    """替代樞紐選項"""
    iata: str
    name: str
    city: str
    price: float
    currency: str = "USD"
    via_recommendation: str


class HubTacticsResponse(BaseModel):
    """替代樞紐戰術回應"""
    success: bool
    destination: str
    direct_price: float
    hub_options: list[HubOptionResponse]
    best_hub: Optional[HubOptionResponse]
    savings_twd: float
    recommendation: str


# ============================================================================
# Mock Data & Logic (Phase 1)
# ============================================================================

# 熱門目的地的替代樞紐
HUB_ALTERNATIVES: dict[str, list[dict]] = {
    "NRT": [
        {"iata": "ICN", "name": "Incheon International", "city": "Seoul", "discount": 0.15},
        {"iata": "HND", "name": "Haneda Airport", "city": "Tokyo", "discount": -0.05},
        {"iata": "NGO", "name": "Chubu Centrair", "city": "Nagoya", "discount": 0.10},
    ],
    "JFK": [
        {"iata": "EWR", "name": "Newark Liberty", "city": "Newark", "discount": 0.08},
        {"iata": "LAX", "name": "Los Angeles International", "city": "Los Angeles", "discount": 0.05},
        {"iata": "ORD", "name": "O'Hare International", "city": "Chicago", "discount": 0.12},
    ],
    "LAX": [
        {"iata": "SFO", "name": "San Francisco International", "city": "San Francisco", "discount": 0.06},
        {"iata": "LAS", "name": "Harry Reid International", "city": "Las Vegas", "discount": 0.10},
    ],
    "LHR": [
        {"iata": "LGW", "name": "Gatwick Airport", "city": "London", "discount": 0.07},
        {"iata": "STN", "name": "Stansted Airport", "city": "London", "discount": 0.12},
        {"iata": "MAN", "name": "Manchester Airport", "city": "Manchester", "discount": 0.15},
    ],
    "CDG": [
        {"iata": "BVA", "name": "Beauvais-Tille Airport", "city": "Paris", "discount": 0.18},
        {"iata": "ORY", "name": "Orly Airport", "city": "Paris", "discount": 0.05},
    ],
}


def _get_mock_hub_analysis(destination: str, origin: str) -> tuple[float, list[HubOptionResponse]]:
    """取得 Mock 樞紐分析

    Returns:
        (直飛價格, 替代樞紐清單)
    """
    import random
    random.seed(hash(f"{origin}{destination}") % (2**32))

    # 基礎直飛價格
    base_price = 600 + random.uniform(200, 400)

    # 取得替代樞紐
    alternatives = HUB_ALTERNATIVES.get(destination, [])

    if not alternatives:
        # 沒有預設替代，使用通用計算
        alternatives = [
            {"iata": "HKG", "name": "Hong Kong International", "city": "Hong Kong", "discount": 0.10},
            {"iata": "SIN", "name": "Changi Airport", "city": "Singapore", "discount": 0.12},
        ]

    hub_options = []
    for alt in alternatives:
        # 替代樞紐價格 = 直飛價格 * (1 - discount)
        adjusted_price = base_price * (1 - alt["discount"])
        # 加入額外航段費用
        transfer_cost = random.uniform(50, 150)
        total_price = adjusted_price + transfer_cost

        hub_options.append(HubOptionResponse(
            iata=alt["iata"],
            name=alt["name"],
            city=alt["city"],
            price=round(total_price, 2),
            currency="USD",
            via_recommendation=(
                f"經 {alt['iata']} 轉機，票價較直飛省 "
                f"{abs(alt['discount'] * 100):.0f}%"
            ),
        ))

    return round(base_price, 2), hub_options


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/hub-tactics",
    response_model=HubTacticsResponse,
    summary="策略5：替代樞紐戰術",
    description="分析從替代樞紐機場出發是否能節省機票費用",
)
async def analyze_hub_tactics(request: AnalyzeRequest) -> HubTacticsResponse:
    """替代樞紐戰術分析

    Args:
        request: AnalyzeRequest，包含 origin, destination

    Returns:
        HubTacticsResponse: 替代樞紐分析結果
    """
    logger.info(
        f"[Strategy-5] Hub tactics: {request.origin} -> {request.destination}"
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
    # Phase 2: 呼叫 Travelpayouts city-directions API
    direct_price, hub_options = _get_mock_hub_analysis(destination, origin)

    # 找出最佳樞紐
    best_hub: Optional[HubOptionResponse] = None
    if hub_options:
        best_hub = min(hub_options, key=lambda x: x.price)

    # 計算節省金額
    if best_hub and best_hub.price < direct_price:
        savings_usd = direct_price - best_hub.price
        savings_twd = round(savings_usd * 31, 2)
        recommendation = (
            f"建議經 {best_hub.iata} ({best_hub.city}) 轉機，"
            f"可省 {savings_twd:.0f} 元"
        )
    else:
        savings_twd = 0.0
        recommendation = "直飛價格較優，無需繞道"

    response = HubTacticsResponse(
        success=True,
        destination=destination,
        direct_price=direct_price,
        hub_options=hub_options,
        best_hub=best_hub,
        savings_twd=savings_twd,
        recommendation=recommendation,
    )

    logger.info(
        f"[Strategy-5] Complete: direct=${direct_price}, "
        f"best_hub={best_hub.iata if best_hub else 'N/A'}, "
        f"savings={savings_twd} TWD"
    )

    return response