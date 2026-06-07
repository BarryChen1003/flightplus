"""策略模組初始化"""

from .nearest_airport import router as nearest_router
from .probability_scan import router as probability_router
from .price_matrix import router as price_matrix_router
from .hub_tactics import router as hub_router
from .recommendation import router as recommendation_router

__all__ = [
    "nearest_router",
    "probability_router",
    "price_matrix_router",
    "hub_router",
    "recommendation_router",
]