"""Shared helpers for the provider feasibility spikes (M0.5)."""

import sys
import time
from collections.abc import Callable
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[2] / ".spike-output"
OUT_DIR.mkdir(exist_ok=True)


def timed[T](label: str, fn: Callable[[], T]) -> T:
    start = time.perf_counter()
    try:
        result = fn()
    except Exception as exc:
        print(f"[FAIL] {label}: {type(exc).__name__}: {exc}")
        raise
    print(f"[ OK ] {label} in {time.perf_counter() - start:.1f}s")
    return result


def require(value: str | None, name: str) -> str:
    if not value:
        print(f"[SKIP] {name} is not set in backend/.env")
        sys.exit(2)
    return value
