"""Redis 客戶端服務（Phase 2 — Upstash 實作）

當 UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN 設定時使用 Upstash Redis，
否則使用記憶體 stub（Phase 1 向後兼容）。
"""

import logging
import os
from typing import Optional

from upstash_redis import Redis

logger = logging.getLogger(__name__)


class RedisClient:
    """Upstash Redis 客戶端封裝"""

    def __init__(self, redis_url: Optional[str] = None) -> None:
        self._redis_url = redis_url or os.environ.get("UPSTASH_REDIS_REST_URL")
        self._token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
        self._client: Optional[Redis] = None
        self._connected = False

        if self._redis_url and self._token:
            logger.info(f"RedisClient initialized with Upstash: {self._redis_url[:40]}...")
        else:
            logger.info("RedisClient initialized (stub mode — set UPSTASH_REDIS_REST_URL to enable)")

    def _get_client(self) -> Redis:
        """延遲初始化客戶端（單例）"""
        if self._client is None:
            url = self._redis_url
            token = self._token
            if url and token:
                self._client = Redis(url=url, token=token)
                logger.info(f"Upstash Redis connected: {url[:40]}...")
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
        logger.info("Disconnected from Redis")

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


# ── Railway/Render 環境變數設定提醒 ──────────────────────────────────────────
# 在 Render Dashboard 的 Environment 加入：
# UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
# UPSTASH_REDIS_REST_TOKEN=你的秘密token
# ────────────────────────────────────────────────────────────────────────────

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