"""策略模組測試"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """建立測試客戶端"""
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

    from main import app
    return TestClient(app)


class TestHealthEndpoints:
    """健康檢查端點測試"""

    def test_health(self, client: TestClient):
        """測試 /health 端點"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "flightplus-worker"

    def test_root(self, client: TestClient):
        """測試根端點"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "endpoints" in data


class TestStrategy1NearestAirport:
    """策略1測試：鄰近機場套利"""

    def test_nearest_airport_success(self, client: TestClient):
        """測試正常分析"""
        response = client.post(
            "/analyze/nearest-airport",
            json={"origin": "TPE", "destination": "NRT"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["origin"] == "TPE"
        assert data["destination"] == "NRT"
        assert "alternatives" in data

    def test_nearest_airport_invalid_origin(self, client: TestClient):
        """測試無效的起點"""
        response = client.post(
            "/analyze/nearest-airport",
            json={"origin": "INVALID", "destination": "NRT"},
        )
        assert response.status_code == 422  # Validation error


class TestStrategy2Probability:
    """策略2測試：機率掃描"""

    def test_probability_success(self, client: TestClient):
        """測試正常分析"""
        response = client.post(
            "/analyze/probability",
            json={"origin": "TPE", "destination": "NRT", "month": "2026-08"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["month"] == "2026-08"
        assert "best_days" in data
        assert "daily_prices" in data

    def test_probability_missing_month(self, client: TestClient):
        """測試缺少月份"""
        response = client.post(
            "/analyze/probability",
            json={"origin": "TPE", "destination": "NRT"},
        )
        assert response.status_code == 400


class TestStrategy4PriceMatrix:
    """策略4測試：多點拆分計算"""

    def test_price_matrix_success(self, client: TestClient):
        """測試正常分析"""
        response = client.post(
            "/analyze/price-matrix",
            json={"origin": "TPE", "destination": "FCO"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "direct_price" in data
        assert "segmented_price" in data
        assert "segments" in data


class TestStrategy5HubTactics:
    """策略5測試：替代樞紐戰術"""

    def test_hub_tactics_success(self, client: TestClient):
        """測試正常分析"""
        response = client.post(
            "/analyze/hub-tactics",
            json={"origin": "TPE", "destination": "NRT"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["destination"] == "NRT"
        assert "hub_options" in data


class TestStrategy6Timing:
    """策略6測試：最佳時機預測 (Stub)"""

    def test_timing_stub(self, client: TestClient):
        """測試時機預測 stub"""
        response = client.post(
            "/analyze/timing",
            json={"origin": "TPE", "destination": "NRT"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["confidence"] == "low"  # Stub always returns low confidence


class TestStrategy7FullAnalysis:
    """策略7測試：完整分析"""

    def test_full_analysis_success(self, client: TestClient):
        """測試完整分析"""
        response = client.post(
            "/analyze/full",
            json={
                "origin": "TPE",
                "destination": "NRT",
                "month": "2026-08",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "job_id" in data
        assert "recommendations" in data
        assert len(data["recommendations"]) > 0

    def test_full_analysis_missing_month(self, client: TestClient):
        """測試缺少月份"""
        response = client.post(
            "/analyze/full",
            json={"origin": "TPE", "destination": "NRT"},
        )
        assert response.status_code == 400