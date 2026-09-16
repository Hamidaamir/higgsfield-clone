"""Tiny in-memory sliding-window limiter to protect free provider quotas from bursts.

Per-process by design: one API instance runs on the free tier and the limit only needs
to stop accidental hammering, not act as a distributed policy.
"""

import time
from collections import defaultdict, deque

from app.core.errors import AppError


class RateLimitedError(AppError):
    status_code = 429
    code = "rate_limited"


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: float) -> None:
        self._limit = limit
        self._window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self._window:
            hits.popleft()
        if len(hits) >= self._limit:
            retry_in = int(self._window - (now - hits[0])) + 1
            raise RateLimitedError(
                f"Too many generation requests. Try again in about {retry_in} seconds.",
                details={"retry_after_seconds": retry_in},
            )
        hits.append(now)

    def reset(self) -> None:
        self._hits.clear()


generation_limiter = SlidingWindowLimiter(limit=12, window_seconds=60)
