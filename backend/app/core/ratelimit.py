"""Tiny in-memory sliding-window limiter to protect free provider quotas from bursts.

Per-process by design: one API instance runs on the free tier and the limit only needs
to stop accidental hammering, not act as a distributed policy.
"""

import time
from collections import defaultdict, deque

from app.config import get_settings
from app.core.errors import AppError


class RateLimitedError(AppError):
    status_code = 429
    code = "rate_limited"


def _humanize(seconds: int) -> str:
    if seconds < 90:
        return f"{seconds} seconds"
    minutes = (seconds + 59) // 60
    return f"{minutes} minutes"


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: float) -> None:
        self._limit = limit
        self._window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, *, what: str = "generation requests") -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self._window:
            hits.popleft()
        if len(hits) >= self._limit:
            retry_in = int(self._window - (now - hits[0])) + 1
            raise RateLimitedError(
                f"Too many {what}. Try again in about {_humanize(retry_in)}.",
                details={"retry_after_seconds": retry_in},
            )
        hits.append(now)

    def reset(self) -> None:
        self._hits.clear()


generation_limiter = SlidingWindowLimiter(
    limit=get_settings().generation_rate_limit_per_minute, window_seconds=60
)
video_user_limiter = SlidingWindowLimiter(
    limit=get_settings().video_rate_limit_per_user_10min, window_seconds=600
)
video_global_limiter = SlidingWindowLimiter(
    limit=get_settings().video_rate_limit_global_per_hour, window_seconds=3600
)
GLOBAL_KEY = "global"
