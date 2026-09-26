# Deployment

Operational notes for running Forma on free tiers. Every value below is a placeholder —
real URLs, tokens and passwords live in the hosting dashboards, never in this repository.

## Architecture

```
Browser
  │  every request is same-origin
  ▼
Vercel ──────────────── Next.js frontend
  │                     /api/* rewritten server-side (next.config.ts → API_ORIGIN)
  ▼
Render ──────────────── FastAPI (uvicorn)
  │
  ▼
Supabase ────────────── PostgreSQL

Cloudinary ──────────── generated + uploaded media
Cloudflare Workers AI ─ images, Aura / MeloTTS speech
Hugging Face ZeroGPU ── video (LTX-Video Space)
Gemini (optional) ───── the Gemini TTS voice model
```

**The rewrite is architectural, not an optimisation.** Because the browser only ever talks
to the Vercel origin, the session cookie (`hf_session`) is first-party and works with
`SameSite=Lax`. Pointing the browser at Render directly would make it a third-party cookie
and require `SameSite=None`, which Safari and Chrome increasingly block. Do not introduce a
`NEXT_PUBLIC_API_URL` or call Render from the browser.

## Frontend — Vercel

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework | Next.js (auto-detected) |
| Install / build | defaults (`npm install`, `next build`) |
| Environment | `API_ORIGIN` = `https://<render-service>.onrender.com` |

`API_ORIGIN` is read in `next.config.ts` at build time, so set it for **Build and Runtime**
and redeploy after changing it. It is the only variable the frontend needs, and there are no
`NEXT_PUBLIC_*` variables anywhere — nothing client-side should ever hold a URL or a secret.

## Backend — Render

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Runtime | Python (`PYTHON_VERSION` 3.12.7) |
| Build command | `pip install -e .` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/api/health` |
| Plan | Free |

`backend/render.yaml` declares this as a Blueprint, with secrets as `sync: false` so Render
prompts for them instead of storing them in Git.

**Migrations are not run by Render.** Render Free has no pre-deploy hook and no shell, and
putting `alembic upgrade head` in the start command would re-run it on every wake from
spin-down. Migrations are applied manually — see below.

`/api/health` runs one `SELECT 1` and calls no AI provider, so health checks never consume
quota. It returns HTTP 200 even when the database is unreachable, reporting
`{"database": "unavailable"}`, so a database outage degrades the app honestly instead of
triggering a restart loop.

## Database — Supabase

The app uses SQLAlchemy async with **asyncpg**, so the URL scheme must be
`postgresql+asyncpg://…`. Supabase shows a `postgresql://…` string; convert the scheme.

Two endpoints work, both on **port 5432**:

**A. Direct connection** — `db.<project-ref>.supabase.co:5432`
Preferred when the runtime has IPv6 connectivity. On the free plan the direct endpoint is
IPv6-only, so it depends on the host being able to reach it.

**B. Shared session pooler** — `aws-0-<region>.pooler.supabase.com:5432`
The IPv4-compatible fallback. Use this if Render cannot reach the direct endpoint.

Use the **session** pooler, not the transaction pooler on port 6543: transaction-mode
pooling does not keep a connection across statements, which conflicts with the prepared
statements asyncpg uses by default. Choose the endpoint during deployment based on what
actually connects; nothing in the code assumes either one.

Supabase requires TLS, which asyncpg negotiates automatically. The app's pool is small
(`pool_size=5, max_overflow=5`) with `pool_pre_ping=True`, comfortably inside free limits.

### Running production migrations

Applied once from a developer machine, against the production database. Three migrations
exist; the first creates the `citext` extension, which the Supabase migration role may do.
There is no seed data — the model, tool and effect catalogs live in source code, so a fresh
database is ready as soon as the migrations land.

```powershell
# PowerShell, from the repository root. Values are placeholders.
$env:DATABASE_URL = "<production-database-url>"   # postgresql+asyncpg://...
cd backend
.venv\Scripts\python.exe -m alembic upgrade head
Remove-Item Env:DATABASE_URL
```

`alembic.ini` leaves `sqlalchemy.url` empty and `alembic/env.py` takes the URL from
settings, so supplying `DATABASE_URL` in the shell is all that is needed. The project is a
plain `pip install -e .` layout — `uv.lock` exists but no tooling depends on `uv`, so use
the interpreter that has the dependencies installed (`.venv` locally, or `python -m alembic`
inside any environment where `pip install -e .` has been run).

Clear `DATABASE_URL` from the shell afterwards so later local commands do not point at
production.

## Google OAuth

The callback is deliberately exposed through the Vercel proxy, so **the Render domain is not
registered with Google at all**.

In Google Cloud Console → Credentials → the existing OAuth client:

- **Authorized redirect URI**: `https://<vercel-domain>/api/auth/google/callback`
- **Authorized JavaScript origin**: `https://<vercel-domain>`
- Keep the existing `http://localhost:3000` entries for local development.

`PUBLIC_APP_URL` on Render must match the Vercel domain exactly — the redirect URI is built
from it, and Google rejects any mismatch. Set it after Vercel assigns the final URL, then
redeploy the backend.

## Environment variables

Names only. Never commit values.

**Frontend (Vercel)**

| Variable | Notes |
|---|---|
| `API_ORIGIN` | `https://<render-service>.onrender.com` |

**Backend (Render)**

| Variable | Required | Notes |
|---|---|---|
| `APP_ENV` | yes | `production` — enables secure cookies, disables `/api/docs` |
| `DATABASE_URL` | yes | `postgresql+asyncpg://…` |
| `SESSION_SECRET` | yes | long random string; production refuses the dev default |
| `PUBLIC_APP_URL` | yes | must be the exact `https://` Vercel URL |
| `CORS_ORIGINS` | recommended | comma-separated or JSON array; only for direct API access |
| `CLOUDINARY_ROOT_FOLDER` | recommended | `forma/production` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | yes | media storage |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | yes | images and primary TTS |
| `HF_TOKEN` | optional | raises the ZeroGPU video quota |
| `GEMINI_API_KEY` | optional | unset removes the Gemini TTS model only |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | unset hides the Google sign-in button |
| `PYTHON_VERSION` | yes | `3.12.7` (declared in `render.yaml`) |
| `GENERATION_RATE_LIMIT_PER_MINUTE`, `VIDEO_RATE_LIMIT_PER_USER_10MIN`, `VIDEO_RATE_LIMIT_GLOBAL_PER_HOUR`, `AUDIO_RATE_LIMIT_PER_USER_10MIN` | optional | sane defaults in code |

**`USE_FAKE_PROVIDERS` must be unset or false in production.** Settings validation refuses to
boot if it is enabled, along with a missing `DATABASE_URL`, the development session secret,
or a non-`https` `PUBLIC_APP_URL`.

### Media paths

`CLOUDINARY_ROOT_FOLDER` sets where new uploads go. Left unset it falls back to
`higgsfield-clone/<APP_ENV>`, which is where existing assets already live — nothing is moved
or renamed by setting the production value, and development keeps its own folder either way.

## Free-tier behaviour

**Render Free**
- Spins down after about 15 minutes of inactivity; waking takes roughly a minute.
- No shell and no pre-deploy hook, which is why migrations are run locally.
- Generation jobs run in-process (`asyncio.create_task`), so a restart, deploy or spin-down
  during a job ends it. On the next start, `reconcile_interrupted` marks anything still
  active as `failed` with a retryable message rather than leaving it stuck "processing".
- Video is the exposed case: a ZeroGPU clip can take minutes, so a job started and abandoned
  may be interrupted. Images and speech finish in seconds.
- Do not add keep-alive traffic to defeat spin-down.

**Supabase Free**
- A project may pause after prolonged inactivity. Resume it from the dashboard before a demo;
  while paused, `/api/health` reports the database as unavailable and signed-in pages show
  an explained error rather than a spinner.
- Do not add keep-alive traffic.

**The public surface does not depend on the backend.** Home, Explore, the catalogs, model and
tool pages, Effects, Cinema Studio, Marketing Studio and Pricing are server-rendered from
source-code config and make no API calls, so a cold backend never blocks a first impression.

## Deployment order

1. Create the Supabase project; note a connection string (direct or session pooler).
2. Create the Render service from `backend/render.yaml`; fill in the `sync: false` variables.
   `PUBLIC_APP_URL` can be provisional at this point.
3. Run the migrations locally against the production database (above).
4. Create the Vercel project with root `frontend` and `API_ORIGIN` pointing at Render.
5. Set `PUBLIC_APP_URL` (and `CORS_ORIGINS`) on Render to the real Vercel URL; redeploy.
6. Add the Vercel redirect URI and origin to the Google OAuth client.
7. Smoke test, starting with `/api/health` and `/system` to wake the backend.
