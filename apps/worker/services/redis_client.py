"""Redis 客戶端服務 (Phase 2 替換真實實作)

目前為 stub 實作，用於 Phase 1 開發。
"""

import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis 客戶端封裝"""

    def __init__(self, redis_url: Optional[str] = None) -> None:
        """初始化 Redis 客戶端

        Args:
            redis_url: Redis 連線 URL，如 redis://localhost:6379
        """
        self._redis_url = redis_url
        self._connected = False
        logger.info("RedisClient initialized (stub mode for Phase 1)")

    async def connect(self) -> None:
        """建立 Redis 連線"""
        if self._redis_url:
            logger.info(f"Would connect to Redis: {self._redis_url}")
        self._connected = True

    async def disconnect(self) -> None:
        """斷開 Redis 連線"""
        self._connected = False
        logger.info("Disconnected from Redis")

    async def get(self, key: str) -> Optional[str]:
        """取得快取值

        Args:
            key: 快取 key

        Returns:
            快取值，若不存在回傳 None
        """
        logger.debug(f"Redis GET (stub): {key}")
        return None

    async def set(
        self,
        key: str,
        value: str,
        ex: Optional[int] = None,
    ) -> bool:
        """設定快取值

        Args:
            key: 快取 key
            value: 快取值
            ex: 過期時間（秒）

        Returns:
            是否設定成功
        """
        logger.debug(f"Redis SET (stub): {key} = {value[:50]}...")
        return True

    async def delete(self, key: str) -> bool:
        """刪除快取值

        Args:
            key: 快取 key

        Returns:
            是否刪除成功
        """
        logger.debug(f"Redis DELETE (stub): {key}")
        return True

    async def exists(self, key: str) -> bool:
        """檢查 key 是否存在

        Args:
            key: 快取 key

        Returns:
            是否存在
        """
        logger.debug(f"Redis EXISTS (stub): {key}")
        return False


# 全域 Redis 客戶端實例
_redis_client: Optional[RedisClient] = None


def get_redis_client() -> RedisClient:
    """取得全域 Redis 客戶端實例"""
    global _redis_client
    if _redis_client is None:
        _redis_client = RedisClient()
    return _redis_client


async def init_redis(redis_url: Optional[str] = None) -> RedisClient:
    """初始化 Redis 連線

    Args:
        redis_url: Redis 連線 URL

    Returns:
        Redis 客戶端實例
    """
    client = RedisClient(redis_url)
    await client.connect()
    global _redis_client
    _redis_client = client
    return client