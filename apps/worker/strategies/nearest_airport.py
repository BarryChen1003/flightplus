"""策略1：鄰近機場套利

邏輯：
1. 接收起點 IATA（如 TPE）
2. 用 Travelpayouts nearest-places-matrix 找方圓 200km 內的所有機場
3. 對每個機場查詢到同一目的地的機票價格
4. 計算價差，顯示「省 NTD」

Phase 1: Mock fallback 回應
Phase 2: 替換真實 API 呼叫
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.types import AnalyzeRequest, NearestAirportResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["strategy-1-nearest-airport"])


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================


class NearestAirportResponse(BaseModel):
    """nearest-airport 端點回應"""
    success: bool
    origin: str
    destination: str
    alternatives: list[dict]
    best_option: Optional[dict]
    total_found: int


# ============================================================================
# Mock Data (Phase 1)
# ============================================================================

MOCK_AIRPORTS: dict[str, dict] = {
    "TPE": {
        "name": "Taiwan Taoyuan International",
        "city": "Taipei",
        "alternatives": {
            "KIX": {
                "name": "Kansai International Airport",
                "city": "Osaka",
                "distance_km": 180.0,
                "price_diff_twd": 1200,
            },
            "NGO": {
                "name": "Chubu Centrair International",
                "city": "Nagoya",
                "distance_km": 210.0,
                "price_diff_twd": 800,
            },
            "FUK": {
                "name": "Fukuoka Airport",
                "city": "Fukuoka",
                "distance_km": 220.0,
                "price_diff_twd": 1500,
            },
        },
    },
    "HKG": {
        "name": "Hong Kong International",
        "city": "Hong Kong",
        "alternatives": {
            "SZX": {
                "name": "Shenzhen Bao'an International",
                "city": "Shenzhen",
                "distance_km": 35.0,
                "price_diff_twd": 600,
            },
            "MFM": {
                "name": "Macau International",
                "city": "Macau",
                "distance_km": 65.0,
                "price_diff_twd": 400,
            },
        },
    },
}


def _usd_to_twd(usd: float) -> float:
    """USD 轉 TWD (約 1 USD = 31 TWD)"""
    return round(usd * 31, 2)


def _build_mock_result(origin: str, destination: str) -> NearestAirportResponse:
    """建立 mock 分析結果"""
    origin_data = MOCK_AIRPORTS.get(origin, MOCK_AIRPORTS["TPE"])
    alternatives = []

    for iata, data in origin_data["alternatives"].items():
        alt = {
            "iata": iata,
            "name": data["name"],
            "city": data["city"],
            "distance_km": data["distance_km"],
            "savings_twd": data["price_diff_twd"],
            "recommendation": f"從 {iata} 出發可省 {data['price_diff_twd']} 元",
        }
        alternatives.append(alt)

    # 找出最佳選項
    best = max(alternatives, key=lambda x: x["savings_twd"]) if alternatives else None

    return NearestAirportResponse(
        success=True,
        origin=origin,
        destination=destination,
        alternatives=alternatives,
        best_option=best,
        total_found=len(alternatives),
    )


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/nearest-airport",
    response_model=NearestAirportResponse,
    summary="策略1：鄰近機場套利分析",
    description="分析從替代機場出發是否能節省機票費用",
)
async def analyze_nearest_airport(request: AnalyzeRequest) -> NearestAirportResponse:
    """分析鄰近機場套利選項

    Args:
        request: AnalyzeRequest，包含 origin, destination, month, beginning_of_period

    Returns:
        NearestAirportResponse: 替代機場分析結果
    """
    logger.info(
        f"[Strategy-1] Nearest airport analysis: {request.origin} -> {request.destination}"
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

    # Phase 1: 回傳 mock 資料
    # Phase 2: 呼叫 Travelpayouts nearest-places-matrix API
    result = _build_mock_result(request.origin.upper(), request.destination.upper())

    logger.info(
        f"[Strategy-1] Found {result.total_found} alternatives, "
        f"best: {result.best_option.get('iata') if result.best_option else 'N/A'}"
    )

    return result