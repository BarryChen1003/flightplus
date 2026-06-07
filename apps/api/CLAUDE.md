# FlightPlus — 你是 Backend Engineer

這是一個**全球機票+酒店比較平台**的 monorepo。

## 你的任務

建立 `apps/api/` — Fastify TypeScript 後端，串接 Travelpayouts API。

## 嚴格限制

- **只看 `apps/api/` 目錄**。其他模組（web、worker）的程式碼不要動。
- **語言**：TypeScript（strict mode）。嚴禁 `any` 型別。
- **禁止 hardcode API keys**，統一用環境變數
- **接口必須與架構文件一致**（見下方 API 路由定義）
- **錯誤處理**：每個 endpoint 都要 try/catch + 正確 HTTP status code
- **完成後**：在 `/Obsidian Vault/FlightPlus/deliveries/backend-fastify-[日期].md` 寫交付報告

## 必須完成的模組

### 1. 專案初始化
```
apps/api/
├── src/
│   ├── index.ts          # Fastify 啟動，port 3001
│   ├── routes/
│   │   ├── flights.ts     # 機票搜尋路由
│   │   ├── hotels.ts      # 飯店搜尋路由
│   │   └── health.ts      # 健康檢查
│   ├── services/
│   │   ├── travelpayouts.ts  # TP API 串接（Data API v1/v2 + Search API）
│   │   ├── cache.ts          # Redis 快取封裝
│   │   └── affiliates.ts     # 聯盟連結生成
│   └── types/
│       └── index.ts      # 共享 TypeScript 型別
├── package.json
├── tsconfig.json
└── .env.example
```

### 2. Travelpayouts API 串接（最關鍵）

**API Token**：向用戶取得 `TRAVELPAYOUTS_TOKEN`

**必須串的 Endpoints：**
```
Data API v1：
- GET /v1/prices/cheap → 便宜機票
- GET /v1/prices/direct → 直飛機票

Data API v2：
- GET /v2/prices/latest → 最近48小時價格
- GET /v2/prices/nearest-places-matrix → 鄰近機場（策略1+5）

靜態數據：
- GET /data/{lang}/airports.json → 機場列表
- GET /data/{lang}/airlines.json → 航空公司列表
- GET /data/{lang}/cities.json → 城市列表

JSON files 端點（可直接請求）：
https://api.travelpayouts.com/data/zh/airports.json
https://api.travelpayouts.com/data/zh/cities.json
https://api.travelpayouts.com/data/zh/airlines.json
```

**貨幣**：統一用 `USD`（機票）、`USD`（飯店）

### 3. API 路由

```typescript
// GET /api/flights/search
// Query: origin, destination, departDate, returnDate?, passengers, currency?
// Response: { flights: FlightOption[], meta: { count, cached } }

interface FlightOption {
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  departure: string;   // ISO datetime
  arrival: string;
  duration: number;    // minutes
  stops: number;       // 0=直飛
  origin: string;      // IATA
  destination: string; // IATA
  affiliateUrl: string; // TP 聯盟連結
}

// GET /api/flights/nearest-airports
// Query: origin, date
// Response: { airports: NearestAirport[] }

interface NearestAirport {
  iata: string;
  name: string;
  distance: number;    // km
  priceDiff: number;  // vs origin price
  savings: number;    // TWD
  flights: FlightOption[];
}

// GET /api/hotels/search
// Query: location, checkIn, checkOut, guests
// Response: { hotels: HotelOption[] }

interface HotelOption {
  name: string;
  location: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  affiliateUrl: string;
}

// GET /api/health
// Response: { status: "ok", timestamp }
```

### 4. Redis 快取策略

```typescript
// 機票結果快取 15 分鐘（策略 1/5）
// 月曆數據快取 1 小時（策略 2/6）
// 城市/機場靜態數據快取 24 小時
```

### 5. 聯盟連結生成

每個 FlightOption 和 HotelOption 的 `affiliateUrl` 必須帶上 TP marker。
格式：`https://flightplus.com/redirect?url=[TP_URL]&marker=[MARKER]`

## 驗證方式

```bash
cd apps/api
npm install
npm run dev
# 測試：curl http://localhost:3001/api/health
# 測試：curl "http://localhost:3001/api/flights/search?origin=TPE&destination=NRT&departDate=2026-08-01"
```

## 交付標準

1. 所有 endpoint 可正常回應（錯誤時回 500 + 錯誤訊息）
2. `npm run build` 無錯誤
3. 有基本的 unit test（Vitest）
4. `.env.example` 列出所有需要的環境變數
5. 交付報告寫入 Obsidian vault

---

*專案架構：/Obsidian Vault/FlightPlus/01-專案架構.md*
*操作模式：只做 apps/api/，不准動其他目錄*