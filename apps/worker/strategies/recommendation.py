"""策略7：最終推薦引擎

邏輯：
1. 彙總策略1/2/4/5 的結果
2. 根據用戶偏好加權（價格優先？時間優先？直飛優先？）
3. 輸出排名結果 + 備案

Phase 1: Mock 彙總
Phase 2: 連結其他策略的真實資料
"""

import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.types import FullAnalysisRequest, FullAnalysisResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["strategy-7-recommendation"])


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================


class StrategyResultResponse(BaseModel):
    """單一策略結果封裝"""
    strategy_name: str
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


class RecommendationItemResponse(BaseModel):
    """推薦項目"""
    rank: int
    route: str
    strategy: str
    price: float
    currency: str = "USD"
    savings_twd: float
    details: dict


class FullAnalysisResponse(BaseModel):
    """完整分析回應"""
    success: bool
    job_id: str
    origin: str
    destination: str
    month: str
    strategies: dict[str, StrategyResultResponse]
    recommendations: list[RecommendationItemResponse]
    best_option: Optional[RecommendationItemResponse]
    summary: str
    created_at: str


# ============================================================================
# Mock Strategy Results (Phase 1)
# ============================================================================


def _get_mock_strategy_results(
    origin: str, destination: str, month: str
) -> dict[str, StrategyResultResponse]:
    """取得 Mock 策略結果（Phase 1）"""
    import random
    random.seed(hash(f"{origin}{destination}{month}") % (2**32))

    return {
        "nearest_airport": StrategyResultResponse(
            strategy_name="nearest_airport",
            success=True,
            data={
                "best_alternative": "KIX",
                "savings_twd": random.randint(500, 2000),
            },
        ),
        "probability": StrategyResultResponse(
            strategy_name="probability",
            success=True,
            data={
                "best_days": ["2026-08-05", "2026-08-19", "2026-08-26"],
                "average_price": 350 + random.uniform(-50, 50),
            },
        ),
        "price_matrix": StrategyResultResponse(
            strategy_name="price_matrix",
            success=True,
            data={
                "direct_price": 800 + random.uniform(0, 200),
                "segmented_price": 650 + random.uniform(0, 100),
                "savings_twd": random.randint(1000, 3000),
            },
        ),
        "hub_tactics": StrategyResultResponse(
            strategy_name="hub_tactics",
            success=True,
            data={
                "best_hub": "ICN",
                "savings_twd": random.randint(800, 2500),
            },
        ),
    }


def _generate_recommendations(
    origin: str,
    destination: str,
    month: str,
    strategy_results: dict[str, StrategyResultResponse],
) -> list[RecommendationItemResponse]:
    """產生推薦列表"""
    import random
    random.seed(hash(f"{origin}{destination}{month}") % (2**32))

    recommendations = []
    rank = 1

    # 1. Hub Tactics 結果
    hub_data = strategy_results.get("hub_tactics", StrategyResultResponse(success=False, strategy_name="hub_tactics"))
    if hub_data.success and hub_data.data:
        recommendations.append(RecommendationItemResponse(
            rank=rank,
            route=f"{origin} → {destination} (經 {hub_data.data.get('best_hub', 'HUB')})",
            strategy="hub_tactics",
            price=750 + random.uniform(0, 150),
            currency="USD",
            savings_twd=hub_data.data.get("savings_twd", 1000),
            details={"via": hub_data.data.get("best_hub"), "recommendation": "經樞紐轉機最優惠"},
        ))
        rank += 1

    # 2. Price Matrix 結果
    matrix_data = strategy_results.get("price_matrix", StrategyResultResponse(success=False, strategy_name="price_matrix"))
    if matrix_data.success and matrix_data.data:
        recommendations.append(RecommendationItemResponse(
            rank=rank,
            route=f"{origin} → {destination} (分段購買)",
            strategy="price_matrix",
            price=matrix_data.data.get("segmented_price", 700),
            currency="USD",
            savings_twd=matrix_data.data.get("savings_twd", 800),
            details={"segmented": True, "recommendation": "分段購買可省運費"},
        ))
        rank += 1

    # 3. Nearest Airport 結果
    nearest_data = strategy_results.get("nearest_airport", StrategyResultResponse(success=False, strategy_name="nearest_airport"))
    if nearest_data.success and nearest_data.data:
        recommendations.append(RecommendationItemResponse(
            rank=rank,
            route=f"{origin} → {destination} (鄰近機場)",
            strategy="nearest_airport",
            price=720 + random.uniform(0, 100),
            currency="USD",
            savings_twd=nearest_data.data.get("savings_twd", 600),
            details={"alternative_airport": nearest_data.data.get("best_alternative"), "recommendation": "鄰近機場出發"},
        ))
        rank += 1

    # 4. 直飛選項
    recommendations.append(RecommendationItemResponse(
        rank=rank,
        route=f"{origin} → {destination} (直飛)",
        strategy="direct",
        price=850 + random.uniform(0, 200),
        currency="USD",
        savings_twd=0,
        details={"direct": True, "recommendation": "直飛最方便"},
    ))

    return recommendations


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/full",
    response_model=FullAnalysisResponse,
    summary="策略7：完整分析（彙總所有策略）",
    description="執行完整分析，彙總所有策略結果並給出最終推薦",
)
async def analyze_full(request: FullAnalysisRequest) -> FullAnalysisResponse:
    """完整分析（策略7）

    Args:
        request: FullAnalysisRequest，包含 origin, destination, month, preferences

    Returns:
        FullAnalysisResponse: 完整分析結果
    """
    logger.info(
        f"[Strategy-7] Full analysis: {request.origin} -> {request.destination} "
        f"for {request.month}"
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
    if not request.month:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month is required (format: YYYY-MM)",
        )

    origin = request.origin.upper()
    destination = request.destination.upper()

    # Phase 1: 彙總 mock 策略結果
    # Phase 2: 實際呼叫策略 1/2/4/5 的 API 或函數
    strategy_results = _get_mock_strategy_results(origin, destination, request.month)

    # 產生推薦列表
    recommendations = _generate_recommendations(
        origin, destination, request.month, strategy_results
    )

    # 找出最佳選項
    best_option: Optional[RecommendationItemResponse] = None
    if recommendations:
        # 根據 savings_twd 排序（排除直飛）
        non_direct = [r for r in recommendations if r.strategy != "direct"]
        if non_direct:
            best_option = max(non_direct, key=lambda x: x.savings_twd)

    # 建立摘要
    if best_option:
        summary = (
            f"根據 {len(strategy_results)} 種策略分析，"
            f"建議{best_option.route}，"
            f"可省 {best_option.savings_twd:.0f} 元"
        )
    else:
        summary = "目前各策略分析中，請稍後再查詢"

    # 產生 job_id
    job_id = str(uuid.uuid4())[:8]

    response = FullAnalysisResponse(
        success=True,
        job_id=job_id,
        origin=origin,
        destination=destination,
        month=request.month,
        strategies=strategy_results,
        recommendations=recommendations,
        best_option=best_option,
        summary=summary,
        created_at=datetime.utcnow().isoformat() + "Z",
    )

    logger.info(
        f"[Strategy-7] Complete: job_id={job_id}, "
        f"recommendations={len(recommendations)}, "
        f"best={best_option.strategy if best_option else 'N/A'}"
    )

    return response