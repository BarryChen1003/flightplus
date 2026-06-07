"""Python dataclass 類型定義"""

from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class DayPrice:
    """單日票價結構"""
    date: str
    price: float
    currency: str = "USD"


@dataclass
class NearestAirportResult:
    """策略1：鄰近機場套利結果"""
    iata: str
    name: str
    city: str
    distance_km: float
    baseline_price: float
    alternative_price: float
    savings_twd: float
    recommendation: str


@dataclass
class ProbabilityScanResult:
    """策略2：機率掃描結果"""
    month: str
    daily_prices: list[DayPrice]
    average_price: float
    min_price: float
    max_price: float
    best_days: list[str]
    recommendation: str


@dataclass
class PriceSegment:
    """票價分段"""
    origin: str
    destination: str
    price: float
    airline: Optional[str] = None


@dataclass
class PriceMatrixResult:
    """策略4：多點拆分計算結果"""
    origin: str
    destination: str
    direct_price: float
    segmented_price: float
    segments: list[PriceSegment]
    savings_twd: float
    recommendation: str


@dataclass
class HubOption:
    """替代樞紐選項"""
    iata: str
    name: str
    city: str
    price: float
    via_recommendation: str


@dataclass
class HubTacticsResult:
    """策略5：替代樞紐戰術結果"""
    destination: str
    direct_price: float
    hub_options: list[HubOption]
    best_hub: Optional[HubOption]
    savings_twd: float
    recommendation: str


@dataclass
class TimingResult:
    """策略6：最佳時機預測結果 (Phase 2)"""
    route: str
    current_price: float
    price_trend: str  # "rising" | "falling" | "stable"
    prediction: str
    confidence: str  # "high" | "medium" | "low"
    recommendation: str


@dataclass
class StrategyResult:
    """單一策略結果封裝"""
    strategy_name: str
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


@dataclass
class RecommendationItem:
    """推薦項目"""
    rank: int
    route: str
    strategy: str
    price: float
    savings_twd: float
    details: dict


@dataclass
class FullAnalysisResult:
    """策略7：完整分析結果"""
    job_id: str
    origin: str
    destination: str
    month: str
    strategies: dict[str, StrategyResult]
    recommendations: list[RecommendationItem]
    best_option: Optional[RecommendationItem]
    summary: str


@dataclass
class AnalyzeRequest:
    """分析請求（通用）"""
    origin: str
    destination: str
    month: Optional[str] = None
    beginning_of_period: Optional[str] = None


@dataclass
class FullAnalysisRequest:
    """完整分析請求"""
    origin: str
    destination: str
    month: str
    preferences: dict = field(default_factory=dict)