# FlightPlus 遷移指南：Railway → Vercel + Render

> 本文件說明如何將 FlightPlus 從 Railway 遷移到 Vercel（前端）+ Render（後端+Worker），**全程 0 付費**。

---

## 費用對照

| 服務 | Railway（舊） | Vercel + Render（新） | 費用 |
|------|--------------|---------------------|------|
| Next.js 前端 | Railway（付費） | Vercel | **免費** |
| Fastify API | Railway（付費） | Render Free | **免費** |
| Python Worker | Railway（付費） | Render Free | **免費** |
| Redis 快取 | （無） | Upstash Free | **免費**（256MB / 500K commands/月）|

**Railway 沒有永久免費方案，試用期結束後需 $5/月。Vercel + Render + Upstash 組合對個人專案完全免費。**

---

## 前置準備（需要你的瀏覽器操作）

### 1. 申請 Upstash Redis（完全免費，無需信用卡）

1. 前往 **https://console.upstash.com** → 點 **Sign Up** → 用 GitHub 登入
2. 點 **Create Database**：
   - Name: `flightplus-cache`
   - Region: `Singapore` 或 `Tokyo`（離台灣近）
   - Type: `Serverless`
   - Protocol: `Redis`
   - TLS: ✅ 啟用
3. 建立完成後，切換到 **REST API** 分頁，複製：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2. 停用 Railway（避免繼續扣費）

1. 前往 **https://railway.app** → 登入 → 選 `flightplus` 專案
2. 點進每個服務 → **Settings** → **Delete Service**（或整個專案刪除）
3. 確認刪除，避免試用期結束後被扣款

### 3. 檢查 GitHub Repository 設定

確認 `BarryChen1003/flightplus` 是公開的（Vercel/Render 讀取公開 repo 無需額外設定）。

---

## 部署步驟

### Step 1：推送更新到 GitHub

```bash
cd flightplus
git add .
git commit -m "feat: migrate from Railway to Vercel + Render

- Add vercel.json for Next.js frontend
- Add render.yaml for API and Worker deployment
- Update cache.ts with Upstash Redis integration
- Update redis_client.py with Upstash Redis integration
- Update .env.example with Upstash + Vercel CORS docs"
git push origin main
```

### Step 2：部署 Vercel（Next.js 前端）

1. 前往 **https://vercel.com** → 用 GitHub 登入
2. 點 **Add New...** → **Project**
3. 選擇 `BarryChen1003/flightplus` repo
4. Vercel 會自動偵測 Next.js framework，確認：
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. 點 **Deploy**

完成後你會得到一個 URL，例如：`https://flightplus-xxx.vercel.app`

### Step 3：部署 Render（Fastify API）

1. 前往 **https://render.com** → 用 GitHub 登入
2. 點 **New +** → **Blueprint**（或 New → Web Service）
3. 連接 `BarryChen1003/flightplus` repo
4. Render 會自動偵測 `render.yaml`，確認：
   - Service Name: `flightplus-api`
   - Region: `Singapore`
   - Plan: `Free`
5. 點 **Apply Blueprint**

然後在 Render Dashboard → `flightplus-api` → **Environment**，新增：
```
UPSTASH_REDIS_REST_URL=https://你的-upstash-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=你的token
TRAVELPAYOUTS_TOKEN=你的TPtoken（如果還沒設定）
TP_MARKER=320764（如果還沒設定）
ALLOWED_ORIGINS=https://你的vercel網址,https://*.vercel.app,http://localhost:3000
```

6. 點 **Save Changes** → **Create/Update Blueprint**

### Step 4：部署 Render（Python Worker）

1. 在 Render → **New +** → **Web Service**
2. 連接 `BarryChen1003/flightplus` repo
3. 手動設定：
   - Name: `flightplus-worker`
   - Region: `Singapore`
   - Environment: `Python 3`
   - Root Directory: `apps/worker`（或留空然後在 Build Command 用 `cd apps/worker`）
   - Build Command: `cd apps/worker && pip install -r requirements.txt && pip install upstash-redis`
   - Start Command: `cd apps/worker && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Plan: `Free`

然後在 Environment 加入相同的 Upstash 環境變數。

### Step 5：更新 API 的 CORS 允許清單

在 Render Dashboard → `flightplus-api` → **Environment**，更新：
```
ALLOWED_ORIGINS=https://你的vercel網址,https://*.vercel.app,http://localhost:3000
```

---

## 驗證部署

### Vercel 前端
```
https://flightplus-xxx.vercel.app
```

### Render API
```
https://flightplus-api.onrender.com/api/health
```

### Render Worker
```
https://flightplus-worker.onrender.com/health
```

---

## 架構對照

```
Railway（舊）                    Vercel + Render（新）
─────────────────                ──────────────────────
Next.js (Railway)        →        Next.js (Vercel)         ✅ 完全免費
Fastify API (Railway)    →        Fastify API (Render)     ✅ Free tier
Python Worker (Railway)  →        Python Worker (Render)   ✅ Free tier
（無 Redis）             →        Upstash Redis            ✅ Free tier
```

---

## 常見問題

**Q: Render Free Tier 有什麼限制？**
> 512MB RAM，共享 CPU，服務閒置 15 分鐘會休眠（之後第一個請求需要 30 秒啟動）。對個人專案足夠。

**Q: Vercel Free Tier 有什麼限制？**
> 100GB 頻寬，100 個網域，無限期使用。個人專案綽綽有餘。

**Q: Upstash Free Tier 夠用嗎？**
> 256MB 儲存，500K commands/月。FlightPlus 初期的流量的每日數百次搜尋絕對夠用。

**Q: 如何確認 Railway 已完全刪除？**
> 登入 Railway Dashboard，確認所有 Service 都處於 Deleted 狀態，且 Settings → Billing 中沒有任何訂閱。

**Q: Vercel 的 URL 很醜，可以自訂網域嗎？**
> 可以，但免費方案需要從 Vercel 購買或使用外部網域（如 GoDaddy 買 flightplus.com然後在 Vercel 設定 CNAME）。目前先用 Vercel 提供的 URL 即可。