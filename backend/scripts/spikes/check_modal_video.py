"""Spike 5: trigger the deployed Modal LTX-Video class from plain Python (as the API will).

Prerequisite: `modal deploy modal_app/ltx_video.py` has succeeded.
Verifies spawn -> poll by call id -> MP4 bytes, and reports latency.
"""

import os
import time

import modal

from app.config import get_settings
from scripts.spikes._common import OUT_DIR, require

PROMPT = "a woman in a lime green jacket walking through a neon-lit city at night, cinematic, slow motion"


def main() -> None:
    s = get_settings()
    os.environ["MODAL_TOKEN_ID"] = require(s.modal_token_id, "MODAL_TOKEN_ID")
    os.environ["MODAL_TOKEN_SECRET"] = require(
        s.modal_token_secret.get_secret_value() if s.modal_token_secret else None, "MODAL_TOKEN_SECRET"
    )

    cls = modal.Cls.from_name("higgsfield-ltx-video", "LTXVideo")
    start = time.perf_counter()
    call = cls().generate.spawn(PROMPT, num_frames=49, width=768, height=512)
    print(f"[ OK ] spawned call id={call.object_id}")

    # Re-hydrate from the id exactly the way the API job runner will.
    handle = modal.FunctionCall.from_id(call.object_id)
    while True:
        try:
            data: bytes = handle.get(timeout=0)
            break
        except TimeoutError:
            print(f"       ...still running ({time.perf_counter() - start:.0f}s)")
            time.sleep(10)

    out = OUT_DIR / "modal-ltx-spawn.mp4"
    out.write_bytes(data)
    print(f"[ OK ] {len(data)} bytes in {time.perf_counter() - start:.0f}s -> {out}")


if __name__ == "__main__":
    main()
