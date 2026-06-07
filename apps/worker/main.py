"""FlightPlus Worker - Python FastAPI Strategy Computation Engine

這是 FlightPlus 的策略計算引擎，負責處理非同步的分析任務。
所有即時機票搜尋由 Node.js 後端（apps/api/）處理。

Port: 8001

Strategy Modules:
- Strategy 1: nearest_airport.py (鄰近機場套利)
- Strategy 2: probability_scan.py (機率掃描)
- Strategy 4: price_matrix.py (多點拆分計算)
- Strategy 5: hub_tactics.py (替代樞紐戰術)
- Strategy 6: timing.py (最佳時機預測 - Phase 2)
- Strategy 7: recommendation.py (最終推薦引擎)
"""

import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ============================================================================
# Logging Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("flightplus.worker")


# ============================================================================
# Lifespan Management
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """應用程式生命週期管理"""
    logger.info("=" * 60)
    logger.info("FlightPlus Worker starting up...")
    logger.info("=" * 60)

    # Startup
    try:
        from services import redis_client
        await redis_client.init_redis()
        logger.info("Redis client initialized")
    except Exception as e:
        logger.warning(f"Redis initialization skipped: {e}")

    yield

    # Shutdown
    logger.info("FlightPlus Worker shutting down...")
    try:
        from services import redis_client
        client = redis_client.get_redis_client()
        if client:
            await client.disconnect()
    except Exception as e:
        logger.warning(f"Redis disconnect error: {e}")


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="FlightPlus Worker",
    description="策略計算引擎 - 負責非同步的歷史數據分析、機率計算、推薦算法",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生產環境應限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Exception Handlers
# ============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """處理 ValueError 例外"""
    logger.error(f"ValueError: {exc}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "Invalid input", "detail": str(exc)},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """處理未預期的例外"""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ============================================================================
# Health Check & Info Endpoints
# ============================================================================

@app.get(
    "/health",
    tags=["health"],
    summary="健康檢查",
    description="檢查 Worker 是否正常運作",
)
async def health_check() -> dict:
    """健康檢查端點"""
    return {
        "status": "healthy",
        "service": "flightplus-worker",
        "version": "1.0.0",
    }


@app.get(
    "/",
    tags=["health"],
    summary="服務資訊",
    description="取得 Worker 基本資訊",
)
async def root() -> dict:
    """服務資訊端點"""
    return {
        "service": "FlightPlus Worker",
        "version": "1.0.0",
        "description": "策略計算引擎",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "strategy_1": "/analyze/nearest-airport",
            "strategy_2": "/analyze/probability",
            "strategy_4": "/analyze/price-matrix",
            "strategy_5": "/analyze/hub-tactics",
            "strategy_6": "/analyze/timing",
            "strategy_7": "/analyze/full",
        },
    }


# ============================================================================
# Include Strategy Routers
# ============================================================================

logger.info("Loading strategy routers...")

try:
    from strategies.nearest_airport import router as nearest_router
    app.include_router(nearest_router)
    logger.info("  ✓ Strategy 1 (nearest-airport) loaded")
except Exception as e:
    logger.error(f"  ✗ Failed to load nearest_airport: {e}")

try:
    from strategies.probability_scan import router as probability_router
    app.include_router(probability_router)
    logger.info("  ✓ Strategy 2 (probability) loaded")
except Exception as e:
    logger.error(f"  ✗ Failed to load probability_scan: {e}")

try:
    from strategies.price_matrix import router as price_matrix_router
    app.include_router(price_matrix_router)
    logger.info("  ✓ Strategy 4 (price-matrix) loaded")
except Exception as e:
    logger.error(f"  ✗ Failed to load price_matrix: {e}")

try:
    from strategies.hub_tactics import router as hub_router
    app.include_router(hub_router)
    logger.info("  ✓ Strategy 5 (hub-tactics) loaded")
except Exception as e:
    logger.error(f"  ✗ Failed to load hub_tactics: {e}")

try:
    from strategies.timing import router as timing_router
    app.include_router(timing_router)
    logger.info("  ✓ Strategy 6 (timing) loaded")
except Exception as e:
    logger.error(f"  ✗ Failed to load timing: {e}")

try:
    from strategies.recommendation import router as recommendation_router
    app.include_router(recommendation_router)
    logger.info("  ✓ Strategy 7 (recommendation) loaded")
except Exception as e:
    logger.error(f"  ✗ Failed to load recommendation: {e}")

logger.info("=" * 60)
logger.info("FlightPlus Worker initialized successfully")
logger.info("=" * 60)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )