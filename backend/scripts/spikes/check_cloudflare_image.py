"""Spike 3: Cloudflare Workers AI image generation over REST (10k free neurons/day).

Tries several models so we learn which ones the free plan actually serves.
"""

import base64
import json

import httpx

from app.config import get_settings
from scripts.spikes._common import OUT_DIR, require, timed

PROMPT = "cinematic portrait of a woman in a lime green jacket, neon city at night, 35mm film"
MODELS: dict[str, tuple[str, dict[str, object]]] = {
    "flux-1-schnell": ("@cf/black-forest-labs/flux-1-schnell", {"prompt": PROMPT, "steps": 4}),
    "sdxl-lightning": (
        "@cf/bytedance/stable-diffusion-xl-lightning",
        {"prompt": PROMPT, "width": 1024, "height": 1024, "num_steps": 4},
    ),
    "flux-2-klein-4b": ("@cf/black-forest-labs/flux-2-klein-4b", {"prompt": PROMPT, "steps": 4}),
    "lucid-origin": ("@cf/leonardo/lucid-origin", {"prompt": PROMPT}),
}


def run(model: str, payload: dict[str, object], account: str, token: str) -> None:
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
    response = httpx.post(url, json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=120)
    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:300]}")
    if response.headers.get("content-type", "").startswith("application/json"):
        data = base64.b64decode(response.json()["result"]["image"])
    else:
        data = response.content
    out = OUT_DIR / f"cf-{model.rsplit('/', 1)[-1]}.png"
    out.write_bytes(data)
    print(f"       {len(data)} bytes -> {out}")


def main() -> None:
    s = get_settings()
    account = require(s.cloudflare_account_id, "CLOUDFLARE_ACCOUNT_ID")
    raw_token = s.cloudflare_api_token.get_secret_value() if s.cloudflare_api_token else None
    token = require(raw_token, "CLOUDFLARE_API_TOKEN")
    results: dict[str, str] = {}
    for label, (model, payload) in MODELS.items():
        try:
            timed(label, lambda m=model, p=payload: run(m, p, account, token))
            results[label] = "ok"
        except Exception as exc:  # keep going so we learn which models are free-eligible
            results[label] = f"fail: {exc}"
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
