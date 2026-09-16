"""Spike 1: PostgreSQL connectivity (Neon in production, local Postgres in dev)."""

import asyncio
import time

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import get_settings
from scripts.spikes._common import require


async def main() -> None:
    url = require(get_settings().database_url, "DATABASE_URL")
    engine = create_async_engine(url, pool_pre_ping=True)
    start = time.perf_counter()
    async with engine.connect() as conn:
        version = (await conn.execute(text("select version()"))).scalar_one()
        await conn.execute(text("create temp table spike_check (id int primary key, note text)"))
        await conn.execute(text("insert into spike_check values (1, 'ok')"))
        note = (await conn.execute(text("select note from spike_check"))).scalar_one()
    assert note == "ok"
    print(f"[ OK ] connect + temp table roundtrip in {time.perf_counter() - start:.1f}s")
    print(f"       {str(version)[:80]}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
