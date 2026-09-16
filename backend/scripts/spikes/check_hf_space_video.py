"""Spike 5b: video generation through a public Hugging Face ZeroGPU Space (gradio_client).

Fallback for Modal (which requires a payment method for any GPU). Uses the official
Lightricks LTX-Video distilled Space. Optional HF_TOKEN raises the ZeroGPU quota.
"""

import os
import shutil
import sys
import time

from gradio_client import Client, handle_file

from app.config import get_settings
from scripts.spikes._common import OUT_DIR

SPACE = "Lightricks/ltx-video-distilled"
PROMPT = "a woman in a lime green jacket walking through a neon-lit city at night, cinematic, slow motion"


def main() -> None:
    os.environ.setdefault("PYTHONUTF8", "1")
    hf = get_settings().hf_token
    token = hf.get_secret_value() if hf else None
    print(f"HF_TOKEN: {'configured' if token else 'not set (anonymous quota)'}")
    start = time.perf_counter()
    client = Client(SPACE, token=token, verbose=False)
    print(f"[ OK ] connected in {time.perf_counter() - start:.1f}s")

    start = time.perf_counter()
    result = client.predict(
        prompt=PROMPT,
        negative_prompt="worst quality, inconsistent motion, blurry, jittery, distorted",
        input_image_filepath=None,
        input_video_filepath=None,
        height_ui=512,
        width_ui=704,
        mode="text-to-video",
        duration_ui=2,
        ui_frames_to_use=9,
        seed_ui=42,
        randomize_seed=True,
        ui_guidance_scale=1,
        improve_texture_flag=True,
        api_name="/text_to_video",
    )
    elapsed = time.perf_counter() - start
    video_path = result[0]["video"] if isinstance(result[0], dict) else result[0]
    out = OUT_DIR / "hf-ltx-t2v.mp4"
    shutil.copy(video_path, out)
    print(f"[ OK ] text-to-video in {elapsed:.0f}s -> {out} ({out.stat().st_size} bytes, seed={result[1]})")

    if "--i2v" in sys.argv:
        ref = OUT_DIR / "cf-flux-1-schnell.png"
        start = time.perf_counter()
        result = client.predict(
            prompt="the woman turns her head and smiles, neon lights flicker, gentle camera push-in",
            negative_prompt="worst quality, inconsistent motion, blurry, jittery, distorted",
            input_image_filepath=handle_file(str(ref)),
            input_video_filepath=None,
            height_ui=512,
            width_ui=704,
            mode="image-to-video",
            duration_ui=2,
            ui_frames_to_use=9,
            seed_ui=42,
            randomize_seed=True,
            ui_guidance_scale=1,
            improve_texture_flag=True,
            api_name="/image_to_video",
        )
        elapsed = time.perf_counter() - start
        video_path = result[0]["video"] if isinstance(result[0], dict) else result[0]
        out = OUT_DIR / "hf-ltx-i2v.mp4"
        shutil.copy(video_path, out)
        print(f"[ OK ] image-to-video in {elapsed:.0f}s -> {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
