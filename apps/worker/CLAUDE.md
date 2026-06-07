# FlightPlus — 你是 Python Data Engineer

這是一個**全球機票+酒店比較平台**的 monorepo。

## 你的任務

建立 `apps/worker/` — Python FastAPI 策略計算引擎，負責策略 1/2/4/5/6/7 的計算。

## 重要前提

- 這個 worker 的目的是**非同步計算**，不處理即時 API 請求
- 即時機票搜尋由 Node.js 後端（`apps/api/`）處理
- Worker 專門跑：歷史數據分析、機率計算、推薦算法
- 結果寫入 Redis 快取，API server 直接讀取

## 必須完成的模組

```
apps/worker/
├── main.py                    # FastAPI 入口，port 8001
├── strategies/
│   ├── nearest_airport.py     # 策略1：鄰近機場套利
│   ├── probability_scan.py    # 策略2：機率掃描（日曆票價分析）
│   ├── price_matrix.py        # 策略4：多點拆分計算
│   ├── hub_tactics.py         # 策略5：替代樞紐戰術
│   ├── timing.py              # 策略6：最佳時機預測
│   └── recommendation.py      # 策略7：最終推薦引擎
├── models/
│   └── types.py               # Python dataclass 類型定義
├── services/
│   └── redis_client.py       # Redis 讀寫
└── requirements.txt
```

## 各策略詳細說明

### 策略1：nearest_airport.py（鄰近機場套利）

**邏輯：**
1. 接收起點 IATA（如 TPE）
2. 用 Travelpayouts `nearest-places-matrix` 找方圓 200km 內的所有機場
3. 對每個機場查詢到同一目的地的機票價格
4. 計算價差，顯示「省 NTD」

**API 呼叫：**
```python
# TP v2 nearest-places-matrix
GET https://api.travelpayouts.com/v2/prices/nearest-places-matrix
  ?currency=usd&origin=TPE&destination=NRT&period_type=month&beginning_of_period=2026-08-01
```

**輸出：**
```python
@dataclass
class NearestAirportResult:
    iata: str
    name: str
    city: str
    distance_km: float
    baseline_price: float      # 從 TPE 起的價格
    alternative_price: float # 從替代機場起的價格
    savings_twd: float        # 省下的金額
    recommendation: str      # "從 KIX 出发更便宜！"
```

### 策略2：probability_scan.py（機率掃描）

**邏輯：**
1. 接收目的地 + 月份
2. 抓 `month-matrix`（整個月的每日票價）
3. 計算：均值、標準差、最低價日期、最高價日期
4. 輸出「性價比最高的 5 天」

**API 呼叫：**
```python
GET https://api.travelpayouts.com/v2/prices/month-matrix
  ?currency=usd&origin=TPE&destination=NRT&month=2026-08
```

**輸出：**
```python
@dataclass
class ProbabilityScanResult:
    month: str                # "2026-08"
    daily_prices: list[DayPrice]
    average_price: float
    min_price: float
    max_price: float
    best_days: list[str]     # ["2026-08-05", "2026-08-19"]
    recommendation: str      # "8月5-7日出發平均最便宜"
```

### 策略4：price_matrix.py（多點拆分策略）

**邏輯：**
1. 接收起點→終點（如 TPE→FCO）
2. 測試分段購買：A→B, B→C vs A→C
3. 計算總價差，找出更便宜的路線

**注意：這需要多次呼叫 TP API，需要計入 rate limit**

### 策略5：hub_tactics.py（替代樞紐戰術）

**邏輯：**
1. 找目的地周圍的主要轉運樞紐（如 NRT 可以用 ICN、NGO、HND 作為替代）
2. 計算：直飛 vs 飛到替代樞紐再轉的總價
3. 輸出「建議轉運點」

**使用資料：**
```python
# TP city-directions
GET https://api.travelpayouts.com/v1/city-directions/NRT
```

### 策略6：timing.py（最佳時機預測）

**邏輯：**
1. 自己累積的歷史票價資料庫（PostgreSQL）
2. 對同一條航線，計算 30/60/90 天前票價 vs 現在票價
3. 預測：「現在買 vs 等 N 天再買」哪個更便宜
4. 輸出置信度（高/中/低）

**需要 PostgreSQL 資料庫**（Phase 2 建立，先跳過）

### 策略7：recommendation.py（最終推薦引擎）

**邏輯：**
1. 彙總策略1/2/4/5 的結果
2. 根據用戶偏好加權（價格優先？時間優先？直飛優先？）
3. 輸出排名結果 + 備案

## API Endpoints（FastAPI）

```python
@router.post("/analyze/nearest-airport")
async def analyze_nearest(data: AnalyzeRequest) → NearestAirportResult

@router.post("/analyze/probability")
async def analyze_probability(data: AnalyzeRequest) → ProbabilityScanResult

@router.post("/analyze/full")
async def analyze_full(data: FullAnalysisRequest) → dict
# full 回傳 Job ID，前端 polling 取結果
```

## 技術限制

- **Framework**：FastAPI + uvicorn
- **Python**：3.11+，type hints 必填
- **快取**：統一用 Redis
- **禁止**：`any` 類型、裸 `except`、`print` 調試

## 交付標準

1. `python main.py` 可以在 `localhost:8001` 啟動
2. 所有 endpoints 有正確的 HTTP status + JSON 回應
3. `pytest` 基本測試覆蓋主要函數
4. 交付報告寫入 `/Obsidian Vault/FlightPlus/deliveries/worker-python-[日期].md`

## 開發指令

```bash
cd apps/worker
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# 測試：http://localhost:8001/health
```

---

*專案架構：/Obsidian Vault/FlightPlus/01-專案架構.md*
*操作模式：只做 apps/worker/，不准動其他目錄*