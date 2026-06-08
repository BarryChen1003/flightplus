# FlightPlus — 全球機票+酒店比較平台

## 專案目標

透過 Travelpayouts API 整合，打造全球機票比價平台，幫助用戶找到最划算的出行方案，並透過聯盟行銷變現。

## 技術棧

- **前端**：Next.js 15 + TypeScript + Tailwind CSS
- **後端 API**：Fastify + TypeScript（port 3001）
- **數據分析**：Python FastAPI Worker（port 8001）
- **快取**：Redis
- **數據庫**：PostgreSQL（Phase 2）
- **部署**：Vercel（前端）+ Railway（後端 + Worker）

## 目錄結構

```
flightplus/
├── apps/
│   ├── api/     ← Fastify TypeScript 後端（port 3001）
│   ├── web/     ← Next.js 網站（port 3000）
│   └── worker/  ← Python FastAPI 策略引擎（port 8001）
├── packages/   ← 共享類型定義
└── data/        ← 靜態數據（城市/機場/航空公司 JSON）
```

## 目前狀態

- Phase 0（架構立項）：完成
- Phase 1（網站 MVP）：✅ Fastify API 完成（需 TP API 連線驗證）
- Phase 1（前端）：✅ Next.js 首頁 + 搜尋結果頁（build clean）
- Phase 1（Worker）：✅ FastAPI skeleton 完成（Phase 2 串真實 API）

## 合作模式

這是一個人（Shark Small）透過多個 AI Agent 協同開發的專案。
**嚴禁任何 agent 修改其他模組的程式碼。**

各模組有獨立的 CLAUDE.md，定義該模組的任務和邊界。

## 第一步：申請 API 存取

在開始 Coding Agent 工作之前，必須先取得：

1. **Travelpayouts API Token**
   - 註冊：https://www.travelpayouts.com/
   - 之後到 https://www.travelpayouts.com/programs/100/tools/api 拿 token

2. **Redis 雲端實例**
   - 申請：https://upstash.com/
   - 拿 REDIS_URL 環境變數

3. 建立 `.env` 檔案（參考各模組的 `.env.example`）

## CLAUDE.md 的嚴格遵守

每個 `apps/*/` 目錄都有獨立的 `CLAUDE.md`。
如果沒有，請先建立再開始 coding。