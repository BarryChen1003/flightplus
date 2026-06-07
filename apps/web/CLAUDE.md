# FlightPlus — 你是 Frontend Engineer

這是一個**全球機票+酒店比較平台**的 monorepo。

## 你的任務

建立 `apps/web/` — Next.js 15 網站前端（Phase 1 MVP）。

## 重要：Phase 1 MVP 範圍

**Phase 1 只做這幾個頁面，不要擴充：**

```
apps/web/app/
├── page.tsx              # 首頁（搜尋框）
├── search/page.tsx       # 搜尋結果頁
└── api/                  # 對接後端（可選，前端直接 fetch 也行）
```

**首頁只需要：**
- 起點/終點輸入（IATA 機場代碼，例如 TPE, NRT, ICN）
- 出發日期選擇器
- 回程日期選擇器（可选，单程可不填）
- 人數選擇（1-9）
- 「搜尋」按鈕

**搜尋結果頁需要：**
- 機票列表卡片（價格、航空、起降時間、轉机次數）
- 鄰近機場套利提示（策略1：「從 KIX 出發省 NT$1,200」）
- 替代樞紐提示（策略5：「經 ICN 轉機更便宜」）
- 飯店推薦區塊（機+酒套裝）
- Buy 按鈕（連結到 TP 聯盟連結）
- 價格日曆視圖（策略2：7月哪幾天最便宜）

## 技術限制

- **Framework**：Next.js 15 (App Router)
- **Language**：TypeScript
- **Styling**：Tailwind CSS（簡單一致即可）
- **嚴禁**：不要用任何 AI UI library，就用基本元件自己刻
- **API 呼叫**：假設後端在 `http://localhost:3001`，未來改 Railway URL

## API 介面（對接後端）

```typescript
// 後端還沒好之前，用 mock data 開發介面
// 等後端上線後把 MOCK_DATA 替換成 fetch

// GET http://localhost:3001/api/flights/search?origin=TPE&destination=NRT&departDate=2026-08-01
const mockFlights = [
  {
    price: 4200,
    currency: "USD",
    airline: "星宇航空",
    flightNumber: "JX800",
    departure: "2026-08-01T08:00:00Z",
    arrival: "2026-08-01T12:30:00Z",
    duration: 270,
    stops: 0,
    origin: "TPE",
    destination: "NRT",
    affiliateUrl: "https://...",
  },
  // ... 更多假資料用於 UI 開發
];

// GET http://localhost:3001/api/flights/nearest-airports?origin=TPE&date=2026-08-01
const mockNearest = [
  { iata: "KIX", name: "關西國際機場", distance: 170, savings: 1200, flights: [...] },
];
```

## 交付標準

1. 首頁可以輸入並發送搜尋請求（console.log payload，後端還沒好）
2. 搜尋結果頁有漂亮的機票卡片展示（mock data）
3. `npm run build` 無錯誤
4. 響應式設計（手機/平板/桌面）
5. 交付報告寫入 `/Obsidian Vault/FlightPlus/deliveries/frontend-nextjs-[日期].md`

## 開發指令

```bash
cd apps/web
npm install
npm run dev  # http://localhost:3000
```

---

*專案架構：/Obsidian Vault/FlightPlus/01-專案架構.md*
*操作模式：只做 apps/web/，不准動其他目錄*