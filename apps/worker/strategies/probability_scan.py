"""策略2：機率掃描（日曆票價分析）

邏輯：
1. 接收目的地 + 月份
2. 抓 month-matrix（整個月的每日票價）
3. 計算：均值、標準差、最低價日期、最高價日期
4. 輸出「性價比最高的 5 天」

Phase 1: Mock fallback 回應
Phase 2: 替換真實 API 呼叫
"""

import logging
import math
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.types import AnalyzeRequest, ProbabilityScanResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["strategy-2-probability-scan"])


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================


class DayPriceResponse(BaseModel):
    """單日票價"""
    date: str
    price: float
    currency: str = "USD"


class ProbabilityScanResponse(BaseModel):
    """機率掃描回應"""
    success: bool
    origin: str
    destination: str
    month: str
    daily_prices: list[DayPriceResponse]
    average_price: float
    min_price: float
    max_price: float
    std_deviation: float
    best_days: list[str]
    recommendation: str


# ============================================================================
# Mock Data (Phase 1)
# ============================================================================


def _generate_mock_prices(month: str, origin: str, destination: str) -> list[DayPriceResponse]:
    """產生一個月的 mock 票價資料"""
    daily_prices = []

    # 解析月份
    try:
        year, month_num = map(int, month.split("-"))
    except ValueError:
        year, month_num = 2026, 8

    # 取得該月天數
    if month_num == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month_num + 1, 1)
    days_in_month = (next_month - datetime(year, month_num, 1)).days

    # 基於 route 產生不同的票價範圍
    base_price = 300 if len(origin) == 3 and len(destination) == 3 else 400
    variance = 150

    import random
    random.seed(hash(f"{origin}{destination}{month}") % (2**32))

    for day in range(1, days_in_month + 1):
        date_str = f"{year}-{month_num:02d}-{day:02d}"
        # 週末稍貴
        date_obj = datetime(year, month_num, day)
        weekend_multiplier = 1.15 if date_obj.weekday() >= 5 else 1.0
        # 隨機波動
        price = round(base_price + random.uniform(-variance, variance) * weekend_multiplier, 2)
        price = max(price, 150)  # 最低價格保障

        daily_prices.append(DayPriceResponse(
            date=date_str,
            price=price,
            currency="USD",
        ))

    return daily_prices


def _analyze_prices(daily_prices: list[DayPriceResponse]) -> dict:
    """分析票價資料"""
    if not daily_prices:
        return {
            "average": 0.0,
            "min": 0.0,
            "max": 0.0,
            "std_dev": 0.0,
            "best_days": [],
        }

    prices = [p.price for p in daily_prices]
    average = sum(prices) / len(prices)
    min_price = min(prices)
    max_price = max(prices)

    # 標準差
    variance = sum((p - average) ** 2 for p in prices) / len(prices)
    std_dev = math.sqrt(variance)

    # 找出低於均價 - 一個標準差的日期（最佳日期）
    threshold = average - std_dev
    best_days = [p.date for p in daily_prices if p.price <= threshold]
    best_days = sorted(best_days)[:5]  # 最多取 5 天

    return {
        "average": round(average, 2),
        "min": round(min_price, 2),
        "max": round(max_price, 2),
        "std_dev": round(std_dev, 2),
        "best_days": best_days,
    }


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/probability",
    response_model=ProbabilityScanResponse,
    summary="策略2：機率掃描分析",
    description="分析一個月內的票價分佈，找出最佳出發日期",
)
async def analyze_probability(request: AnalyzeRequest) -> ProbabilityScanResponse:
    """機率掃描分析

    Args:
        request: AnalyzeRequest，包含 origin, destination, month

    Returns:
        ProbabilityScanResponse: 月度票價分析結果
    """
    logger.info(
        f"[Strategy-2] Probability scan: {request.origin} -> {request.destination} "
        f"for month {request.month}"
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

    # Phase 1: Mock 資料
    # Phase 2: 呼叫 Travelpayouts month-matrix API
    daily_prices = _generate_mock_prices(
        request.month, request.origin.upper(), request.destination.upper()
    )
    analysis = _analyze_prices(daily_prices)

    # 建立推薦文字
    if analysis["best_days"]:
        first_best = analysis["best_days"][0]
        recommendation = (
            f"{len(analysis['best_days'])} 個日期的票價低於均價，"
            f"建議優先考慮 {first_best}，平均可省下 ${analysis['std_dev']:.0f} USD"
        )
    else:
        recommendation = "票價波動較大，建議持續觀察"

    response = ProbabilityScanResponse(
        success=True,
        origin=request.origin.upper(),
        destination=request.destination.upper(),
        month=request.month,
        daily_prices=daily_prices,
        average_price=analysis["average"],
        min_price=analysis["min"],
        max_price=analysis["max"],
        std_deviation=analysis["std_dev"],
        best_days=analysis["best_days"],
        recommendation=recommendation,
    )

    logger.info(
        f"[Strategy-2] Analysis complete: avg=${analysis['average']}, "
        f"best_days={len(analysis['best_days'])}"
    )

    return response