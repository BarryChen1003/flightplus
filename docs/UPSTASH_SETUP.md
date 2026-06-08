# FlightPlus — Upstash Redis 安裝指南

> **目的：** Phase 2 前置工作。將目前記憶體快取替換為 Upstash Redis，消除 Railway 部署後的單點故障。  
> **預計完成時間：** 30 分鐘（申請 + 配置 + 驗證）  
> **成本：** 免費（Free Tier: 3 資料庫、10K 命令/天，夠用）

---

## 前提認知

目前 FlightPlus 的快取狀態：

| 元件 | 目前 | 完成後 |
|------|------|--------|
| `apps/api/src/services/cache.ts` | 記憶體 Map（程序重啟消失）| Upstash Redis |
| `apps/worker/services/redis_client.py` | Stub 空殼 | 真實連線 |
| Railway 部署 | 任何實例重啟快取消失 | 持久化 |
| 多實例擴展 | 無法（各實例記憶體隔離）| 共享快取 |

**Railway 部署完成後，沒有 Redis = 每次搜尋都打 TP API = 很快就 rate limit。**

---

## 步驟 1：申請 Upstash 帳號

### 1.1 前往 Upstash

瀏覽器打開：**https://upstash.com**

點擊 **Sign Up**，使用以下任一方式：
- **GitHub 登入**（推薦，最快）
- Google 登入
- Email 註冊

> 如果沒有特殊需求，選擇 **GitHub 登入**，後續綁定更簡單。

### 1.2 建立 Redis 資料庫

登入後 Dashboard 點擊 **Create Database**：

```
Name: flightplus-cache
Region: 選擇跟你 Railway 部署最接近的區域
       → 歐美用戶為主：Frankfurt (eu-central-1)
       → 亞洲用戶為主：Singapore (ap-southeast-1)
       → 不確定：默認或 Tokyo
Type: Serverless (按用量計費，Free Tier 有足夠額度)
Protocol: Redis (不是 Kafka)
TLS/SSL: 啟用（Railway 需要 TLS 連線）
```

點擊 **Create**，等待建立完成（約 10 秒）。

---

## 步驟 2：取得連線資訊

進入資料庫頁面，切換到 **REST API** 分頁（如分頁不存在則在 Settings 中找）：

你會看到兩個關鍵值：

```
UPSTASH_REDIS_REST_URL: https://xxx-xxx-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN: 你的秘密token（不要分享）
```

> ⚠️ **重要：** 把這兩個值記下來。頁面關掉之後可以從 Settings 重新取得，但 Token 只能看一次完整內容。

### 2.1 確認 REST API 端點可用

在瀏覽器直接打開 `UPSTASH_REDIS_REST_URL`，應該看到：
```json
{"error":"Unauthorized"}
```

表示端點正常，只是需要 Token 驗證。

---

## 步驟 3：設定 Railway 環境變數

### 3.1 登入 Railway

前往 **https://railway.app** → 登入 → 選擇 `flightplus` 專案

### 3.2 設定變數

找到你的 API 服務（已部署的 Fastify 服務）→ **Variables** 分頁：

新增以下環境變數：

```
# Upstash Redis 設定
UPSTASH_REDIS_REST_URL=https://xxx-xxx-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=你的秘密token
REDIS_URL=https://xxx-xxx-xxx.upstash.io（鐵路向前兼容，同時設定）
```

Railway 設定 `REDIS_URL` 維持向後相容（代碼中兩種都支援）。

### 3.3Redeploy

設定完環境變數後，點擊 Railway 上的 **Redeploy**，讓新實例讀取到新的環境變數。

---

## 步驟 4：更新 API Server 的快取服務

### 4.1 安裝套件

```bash
cd apps/api
npm install @upstash/redis
```

### 4.2 更新 cache.ts

`apps/api/src/services/cache.ts` 目前是記憶體版本，需要替換成 Upstash 實作。

**原則：**
- 保持現有的 `TTL` 常數不變
- 保持現有的介面不變（`cacheGet`、`cacheSet`、`cacheDelete`）
- 只替換底層實作，呼叫端不需修改

```typescript
// apps/api/src/services/cache.ts
import { Redis } from "@upstash/redis";

// ── TTL 常數（不變）────────────────────────────
export const TTL = {
  FLIGHT_SEARCH: 15 * 60,   // 15 分鐘
  CALENDAR_DATA: 60 * 60,   // 1 小時
  STATIC_DATA: 24 * 60 * 60, // 24 小時
  HOTEL_SEARCH: 30 * 60,    // 30 分鐘
} as const;

// ── Upstash Redis 客戶端初始化 ─────────────────
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!restUrl || !restToken) {
    console.warn("[cache] REDIS_URL not set, falling back to memory");
    return null;
  }
  
  redis = new Redis({ url: restUrl, token: restToken });
  return redis;
}

// ── 記憶體 fallback（完全保留，確保無 Redis 時仍可運作）──
const memCache = new Map<string, { value: string; expiry: number }>();

function memGet(key: string): string | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { memCache.delete(key); return null; }
  return entry.value;
}

function memSet(key: string, value: string, ttl: number): void {
  memCache.set(key, { value, expiry: Date.now() + ttl * 1000 });
}

// ── 公開 API（介面不變）─────────────────────────
export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (client) {
    try {
      const val = await client.get<string>(key);
      return val ?? null;
    } catch (e) {
      console.warn("[cache] Redis GET failed, falling back:", e);
    }
  }
  return memGet(key);
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      await client.set(key, value, { ex: ttlSeconds });
      return;
    } catch (e) {
      console.warn("[cache] Redis SET failed, falling back:", e);
    }
  }
  memSet(key, value, ttlSeconds);
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      await client.del(key);
      return;
    } catch (e) {
      console.warn("[cache] Redis DEL failed:", e);
    }
  }
  // memCache.delete(key) // 可選：也清除記憶體
}

// ── 便利方法 ───────────────────────────────────
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function cacheSetJson<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}
```

### 4.3 更新 index.ts（加入 Redis 就緒日誌）

`apps/api/src/index.ts` 中的 `initCache` 需傳入完整 URL（目前已正確）：

```typescript
// 確認環境變數名稱一致（不做修改，已正確）：
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
console.log(`[cache] Redis: ${redisUrl ? 'Upstash connected' : 'memory fallback'}`);
```

---

## 步驟 5：更新 Python Worker 的 Redis 客戶端

### 5.1 安裝套件

```bash
cd apps/worker
source venv/bin/activate
pip install upstash-redis
```

`upstash-redis` 是 Upstash 官方的 Python SDK，支援 REST API + TLS，適合 Railway 等無標準 Redis 連接埠的環境。

### 5.2 更新 redis_client.py（Phase 2 替換 stub）

替換 `apps/worker/services/redis_client.py` 的內容：

```python
"""Redis 客戶端服務（Phase 2 — Upstash 實作）"""
import json
import logging
from typing import Any, Optional

from upstash_redis import Redis

logger = logging.getLogger(__name__)


class RedisClient:
    """Upstash Redis 客戶端封裝"""

    def __init__(self, redis_url: Optional[str] = None) -> None:
        self._redis_url = redis_url or self._get_from_env()
        self._client: Optional[Redis] = None

    def _get_from_env(self) -> Optional[str]:
        """從環境變數讀取 Upstash REST URL"""
        import os
        return os.environ.get("UPSTASH_REDIS_REST_URL")

    def _get_token(self) -> Optional[str]:
        """從環境變數讀取 Upstash REST Token"""
        import os
        return os.environ.get("UPSTASH_REDIS_REST_TOKEN")

    def _get_client(self) -> Redis:
        """延遲初始化客戶端（單例）"""
        if self._client is None:
            url = self._redis_url
            token = self._get_token()
            if url and token:
                self._client = Redis(url=url, token=token)
                logger.info(f"Upstash Redis connected: {url[:50]}...")
            else:
                raise RuntimeError(
                    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN "
                    "must be set for Phase 2 Redis"
                )
        return self._client

    async def connect(self) -> None:
        """測試連線（Upstash SDK 是同步的，但 FastAPI 需 async）"""
        try:
            client = self._get_client()
            client.ping()
            self._connected = True
            logger.info("Redis connection verified")
        except Exception as e:
            logger.warning(f"Redis connection failed (will retry): {e}")
            self._connected = False

    async def disconnect(self) -> None:
        """斷開連線"""
        self._client = None
        self._connected = False

    async def get(self, key: str) -> Optional[str]:
        """取得快取值"""
        try:
            client = self._get_client()
            value = client.get(key)
            return value if isinstance(value, str) else None
        except Exception as e:
            logger.warning(f"Redis GET {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: str,
        ex: Optional[int] = None,
    ) -> bool:
        """設定快取值"""
        try:
            client = self._get_client()
            client.set(key, value, ex=ex)
            return True
        except Exception as e:
            logger.warning(f"Redis SET {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """刪除快取值"""
        try:
            client = self._get_client()
            client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis DEL {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """檢查 key 是否存在"""
        try:
            client = self._get_client()
            return bool(client.exists(key))
        except Exception as e:
            logger.warning(f"Redis EXISTS {key}: {e}")
            return False


# ── Railway 環境變數設定提醒 ─────────────────────
# 在 Railway 的 Variables 分頁新增：
# UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
# UPSTASH_REDIS_REST_TOKEN=你的秘密token
# ────────────────────────────────────────────────

_redis_client: Optional[RedisClient] = None


def get_redis_client() -> RedisClient:
    """取得全域 Redis 客戶端實例"""
    global _redis_client
    if _redis_client is None:
        _redis_client = RedisClient()
    return _redis_client


async def init_redis(redis_url: Optional[str] = None) -> RedisClient:
    """初始化 Redis 連線"""
    client = RedisClient(redis_url)
    await client.connect()
    global _redis_client
    _redis_client = client
    return client
```

### 5.3 更新 Railway Worker 環境變數（如果 Worker 也部署）

如果 Python Worker 要單獨部署到 Railway，同樣需要設定：
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=你的秘密token
```

---

## 步驟 6：快取 Key 命名規範

為避免不同模組的 key 衝突，統一格式：

```
flights:{origin}:{destination}:{date}     # 單次搜尋結果（TTL: 15min）
flights:nearest:{origin}:{date}            # 鄰近機場分析（TTL: 15min）
flights:calendar:{origin}:{destination}:{month}  # 月曆票價（TTL: 1hr）
static:airports                            # 機場靜態資料（TTL: 24hr）
static:airlines                            # 航空公司靜態資料（TTL: 24hr）
worker:result:{job_id}                     # Worker 非同步結果（TTL: 1hr）
```

---

## 步驟 7：驗證連線

### 7.1 本地驗證

建立 `test-redis.ts`（放在 `apps/api/src/scripts/test-redis.ts`，**不要 commit 到 Git**）：

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function test() {
  await redis.set("test:ping", "pong", { ex: 60 });
  const val = await redis.get("test:ping");
  console.log("✅ Redis connected:", val);

  // 清除測試 key
  await redis.del("test:ping");
}

test().catch((e) => console.error("❌ Redis failed:", e));
```

執行：
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io \
UPSTASH_REDIS_REST_TOKEN=xxx \
npx tsx src/scripts/test-redis.ts
```

### 7.2 Railway 驗證

Railway redeploy 完成後，檢查 API 日誌：
```
[cache] Redis: Upstash connected
```

或在 Railway 開啟 **Logs**，搜尋 `Redis`。

### 7.3 確認 Railway 有讀到正確變數

Railway 介面 → 你的 API 服務 → Variables → 確認：
- `UPSTASH_REDIS_REST_URL` ✅ 已設定
- `UPSTASH_REDIS_REST_TOKEN` ✅ 已設定

---

## 步驟 8：更新 .env.example

在 `apps/api/.env.example` 加入：
```
# === Upstash Redis（Phase 2）===
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=你的秘密token
```

在 `apps/worker/.env.example` 加入（如果有的話）：
```
# === Upstash Redis（Phase 2）===
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=你的秘密token
```

---

## 常見問題

**Q: Upstash Free Tier 够用嗎？**
> 够。FlightPlus 的流量在初期很小（個人專案），10K 命令/天足夠支撐每日數百次搜尋。真的超出免費額度再升級。

**Q: Railway 和 Upstash 不同區域會很慢嗎？**
> 可能有 20-50ms 額外延遲，但對於機票搜尋（幾百毫秒 API 回應）影響可忽略。如遇延遲問題再考慮切換到同區域。

**Q: 忘記 REST Token 了怎麼辦？**
> Upstash Dashboard → 你的資料庫 → Settings → REST API → Regenerate Token（新 Token 產生後舊的失效）。

**Q: Railway 部署後 REDIS_URL 應該設什麼？**
> 設 `UPSTASH_REDIS_REST_URL` 的值即可。API 程式碼同時讀取 `REDIS_URL`（向後兼容）和 `UPSTASH_REDIS_REST_URL`（Phase 2 主要）。

**Q: Worker 也要部署到 Railway 嗎？**
> 目前 Railway 只部署 API Server（`apps/api`）。如果日後 Worker 也要 Railway 部署，需另外建立一個 Railway service 並設定同樣的 Redis 環境變數。