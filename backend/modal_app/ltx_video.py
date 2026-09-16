"""Self-hosted LTX-Video on Modal (Starter plan, no card).

Deployed separately from the API:  `modal deploy modal_app/ltx_video.py`
The API never imports this module; it calls the deployed class by name
(`modal.Cls.from_name(...)`) and stores the FunctionCall id for polling.

Resolution/frame limits are deliberately conservative so a clip finishes in
roughly a minute on a single A10G and the monthly compute credit lasts.
"""

from __future__ import annotations

import io
from typing import Any

import modal

APP_NAME = "higgsfield-ltx-video"
MODEL_ID = "Lightricks/LTX-Video-0.9.5"
CACHE_DIR = "/cache"

MAX_WIDTH = 768
MAX_HEIGHT = 512
MAX_FRAMES = 121  # 5 s at 24 fps (frames must be 8k + 1)
DEFAULT_NEGATIVE = "worst quality, inconsistent motion, blurry, jittery, distorted, watermark, text, logo"

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .pip_install(
        "torch==2.6.0",
        "diffusers>=0.33",
        "transformers>=4.49",
        "accelerate>=1.4",
        "sentencepiece",
        "imageio[ffmpeg]",
        "pillow",
        "huggingface_hub",
        "numpy",
    )
    .env({"HF_HOME": CACHE_DIR, "HF_HUB_ENABLE_HF_TRANSFER": "0"})
)

app = modal.App(APP_NAME)
weights = modal.Volume.from_name("higgsfield-ltx-weights", create_if_missing=True)


def _snap(value: int, step: int, maximum: int, minimum: int) -> int:
    value = max(minimum, min(maximum, value))
    return value - (value % step)


@app.cls(
    image=image,
    gpu="A10G",
    timeout=600,
    scaledown_window=90,
    volumes={CACHE_DIR: weights},
)
class LTXVideo:
    @modal.enter()
    def load(self) -> None:
        import torch
        from diffusers import LTXImageToVideoPipeline, LTXPipeline

        self.pipe = LTXPipeline.from_pretrained(MODEL_ID, torch_dtype=torch.bfloat16).to("cuda")
        self.i2v_pipe = LTXImageToVideoPipeline(**self.pipe.components)
        weights.commit()

    @modal.method()
    def generate(
        self,
        prompt: str,
        *,
        negative_prompt: str | None = None,
        width: int = 768,
        height: int = 512,
        num_frames: int = 97,
        fps: int = 24,
        num_inference_steps: int = 30,
        seed: int | None = None,
        image_bytes: bytes | None = None,
    ) -> bytes:
        """Return an H.264 MP4 as bytes. `image_bytes` switches to image-to-video."""
        import imageio.v3 as iio
        import numpy as np
        import torch
        from PIL import Image

        width = _snap(width, 32, MAX_WIDTH, 256)
        height = _snap(height, 32, MAX_HEIGHT, 256)
        num_frames = max(9, min(MAX_FRAMES, num_frames))
        num_frames = ((num_frames - 1) // 8) * 8 + 1
        generator = torch.Generator("cuda").manual_seed(seed) if seed is not None else None

        common: dict[str, Any] = {
            "prompt": prompt,
            "negative_prompt": negative_prompt or DEFAULT_NEGATIVE,
            "width": width,
            "height": height,
            "num_frames": num_frames,
            "num_inference_steps": num_inference_steps,
            "generator": generator,
            "output_type": "np",
        }
        if image_bytes:
            source = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((width, height))
            frames = self.i2v_pipe(image=source, **common).frames[0]
        else:
            frames = self.pipe(**common).frames[0]

        video = (np.asarray(frames) * 255).round().astype("uint8")
        buffer = io.BytesIO()
        # libx264 + yuv420p so the result plays in every browser <video> element.
        iio.imwrite(
            buffer,
            video,
            extension=".mp4",
            fps=fps,
            codec="libx264",
            output_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        )
        return buffer.getvalue()


@app.local_entrypoint()
def main(prompt: str = "a woman in a lime jacket walking through a neon city at night, cinematic") -> None:
    """Quick smoke test: `modal run modal_app/ltx_video.py --prompt "..."`."""
    from pathlib import Path

    data = LTXVideo().generate.remote(prompt, num_frames=49)
    out = Path(".spike-output/modal-ltx.mp4")
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(data)
    print(f"wrote {len(data)} bytes to {out}")
