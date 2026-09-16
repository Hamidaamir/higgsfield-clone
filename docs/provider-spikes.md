# Provider feasibility spikes (M0.5)

Run on 2026-09-17 from the local development machine with the spike scripts in
`backend/scripts/spikes/`. Every service below is on a free tier with **no payment method on file**.
Generated outputs land in `backend/.spike-output/` (git-ignored).

| Capability | Provider | Model | Result | Latency | Cost / free status | Limitation | Decision |
|---|---|---|---|---|---|---|---|
| Media storage | Cloudinary (Free plan, 0/25 credits used) | — | upload → public URL → GET 200 → delete: pass | upload 1.8 s, GET 2.2 s | Free, no card | 25 credits/mo shared across storage/bandwidth/transforms; URLs are public (unguessable ids) | **Primary** |
| Image | Cloudflare Workers AI | `@cf/black-forest-labs/flux-1-schnell` | pass, 1024² PNG (~725 KB, base64 JSON) | 4.0 s | 10k neurons/day free; ≈19 neurons/image; over-quota → error, never billed | text-to-image only | **Primary (default model)** |
| Image | Cloudflare Workers AI | `@cf/bytedance/stable-diffusion-xl-lightning` | pass, binary PNG | 3.5 s | free during beta ($0/step) | beta | Secondary model |
| Image | Cloudflare Workers AI | `@cf/leonardo/lucid-origin` | pass, binary PNG | 5.9 s | free tier | — | Secondary model |
| Image edit | Cloudflare Workers AI | `@cf/black-forest-labs/flux-2-klein-4b` | pass: text-to-image and reference-image edit (multipart) | 25 s (t2i), 14 s (edit) | free tier | slow; safety filter blocked one portrait edit; edits re-imagine the scene rather than preserve it | P1 image-edit path |
| Image (fallback) | Pollinations.ai | FLUX | not exercised (Cloudflare succeeded) | — | free, no key | community service, rate limited | Fallback only |
| TTS | Cloudflare Workers AI | `@cf/myshell-ai/melotts` | pass; **returns WAV** (RIFF) despite docs saying MP3 | 2.2 s | 18.6 neurons/min — effectively unlimited | single voice per language, no style control | **Primary (default)** |
| TTS | Cloudflare Workers AI | `@cf/deepgram/aura-1` | pass; real MP3 | 1.5 s | 1,364 neurons/1k chars → ~7k chars/day | 12 named voices, English only | Primary (voice picker) |
| TTS | Google AI Studio | `gemini-2.5-flash-preview-tts` | pass; 24 kHz PCM wrapped as WAV | 6.2 s | free tier | rate limits undocumented; slower | Secondary (style-prompt "voice details") |
| Video | Modal Starter | LTX-Video 0.9.5 (self-hosted) | **blocked**: "Please add a payment method to use A10G/T4/L4/L40S GPU functions" | image built in 77 s, then refused | Starter credit exists but **any GPU requires a card** | — | **Rejected** (no card will be added) |
| Video | Hugging Face ZeroGPU Space `Lightricks/ltx-video-distilled` via `gradio_client` | LTX-Video distilled | pass: text-to-video and image-to-video, valid H.264 MP4 (`ftypisom`), plays in Chromium, 704×512, 2 s | 6–11 s per 2 s clip (anonymous) | free, no card | **daily quota**: 2 min anonymous / 5 min with a free HF token; each call claims 60 s → ~2 clips/day anonymous, ~5/day with token; queue priority "low/medium"; third-party Space may change | **Primary**, with quota surfaced in the UI |

All audio outputs were verified as playable in headless Chromium (durations 4.5–6.8 s).

## Decisions

- **Image** — PRIMARY: Cloudflare Workers AI FLUX.1 schnell (SDXL-Lightning, Lucid Origin, FLUX.2 klein as selectable models). FALLBACK: Pollinations FLUX.
- **Audio/TTS** — PRIMARY: Cloudflare Workers AI (MeloTTS default, Aura-1 voices). FALLBACK: Gemini TTS.
- **Video** — PRIMARY: Hugging Face ZeroGPU Space (`Lightricks/ltx-video-distilled`) through `gradio_client`, using a free-account `HF_TOKEN`. FALLBACK: none that is free; the UI reports quota exhaustion honestly. STATUS: **REAL GENERATION VIABLE** (low daily volume).

## Notes

- Modal's `as-` secret prefix had been dropped when the token was copied into `.env`; fixed locally before the test.
- The Modal CLI crashes on the Windows console code page unless `PYTHONUTF8=1` is set.
- The empty Modal volume created during the attempt was deleted; no Modal app was deployed and no compute was consumed beyond image builds.
