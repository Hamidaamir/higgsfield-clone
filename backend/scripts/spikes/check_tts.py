"""Spike 4: text-to-speech via Cloudflare (MeloTTS, Aura-1) and Gemini TTS (free tier)."""

import base64
import json
import struct

import httpx

from app.config import get_settings
from scripts.spikes._common import OUT_DIR, timed

TEXT = "Welcome to Higgsfield. Lifelike speech from any script, ready for your projects."


def cloudflare(model: str, payload: dict[str, object], account: str, token: str, out_name: str) -> None:
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
    response = httpx.post(url, json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=120)
    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:300]}")
    content_type = response.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        data = base64.b64decode(response.json()["result"]["audio"])
    else:
        data = response.content
    out = OUT_DIR / out_name
    out.write_bytes(data)
    print(f"       {len(data)} bytes ({content_type}) -> {out}")


def pcm_to_wav(pcm: bytes, sample_rate: int = 24000) -> bytes:
    """Gemini TTS returns raw 16-bit mono PCM; wrap it in a WAV container."""
    fmt = struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16)
    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + fmt
    return header + b"data" + struct.pack("<I", len(pcm)) + pcm


def gemini(api_key: str) -> None:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent"
    )
    payload = {
        "contents": [{"parts": [{"text": f"Say warmly, like a documentary narrator: {TEXT}"}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Kore"}}},
        },
    }
    response = httpx.post(url, json=payload, headers={"x-goog-api-key": api_key}, timeout=120)
    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:300]}")
    part = response.json()["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm = base64.b64decode(part["data"])
    out = OUT_DIR / "gemini-tts.wav"
    out.write_bytes(pcm_to_wav(pcm))
    print(f"       mime={part['mimeType']} {len(pcm)} pcm bytes -> {out}")


def main() -> None:
    s = get_settings()
    results: dict[str, str] = {}
    account = s.cloudflare_account_id
    token = s.cloudflare_api_token.get_secret_value() if s.cloudflare_api_token else None
    if account and token:
        cases = (
            ("cf-melotts", "@cf/myshell-ai/melotts", {"prompt": TEXT, "lang": "en"}, "cf-melotts.mp3"),
            (
                "cf-aura-1",
                "@cf/deepgram/aura-1",
                {"text": TEXT, "speaker": "luna", "encoding": "mp3"},
                "cf-aura-1.mp3",
            ),
        )
        for label, model, payload, name in cases:
            try:
                timed(label, lambda m=model, p=payload, n=name: cloudflare(m, p, account, token, n))
                results[label] = "ok"
            except Exception as exc:
                results[label] = f"fail: {exc}"
    else:
        results["cloudflare"] = "skipped (no credentials)"

    if s.gemini_api_key:
        key = s.gemini_api_key.get_secret_value()
        try:
            timed("gemini-tts", lambda: gemini(key))
            results["gemini-tts"] = "ok"
        except Exception as exc:
            results["gemini-tts"] = f"fail: {exc}"
    else:
        results["gemini-tts"] = "skipped (no credentials)"
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
