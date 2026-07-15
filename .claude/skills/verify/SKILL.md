---
name: verify
description: How to run and verify this dashboard end-to-end locally (frontend + backend + seeded data), including auth and dev-server gotchas.
---

# Verifying the anomaly dashboard locally

The deployed backend (`https://atonality123-test101.hf.space`) uses an
APP_PASSWORD that is a HF Space secret — the value in the frontend `.env`
does NOT match it, so you cannot log in against production. Verify against
a local backend instead.

## Recipe that works

1. **Backend** (from `../Anomaly-Dashboard-Backend`, has its own `.venv`):

   ```bash
   APP_PASSWORD=localtest123 .venv/Scripts/python.exe -m uvicorn app.main:app --port 8000 --host 127.0.0.1
   ```

   Don't run it with APP_PASSWORD unset: data endpoints go open, but
   `/api/auth/login` returns 503, so the frontend PasswordGate can never pass.

2. **Seed data**: data is in-memory; re-seed after every backend restart.
   POST the 5 CSVs to `/api/upload` (multipart keys: pea_bfkt, pea_tuc,
   mea_bfkt, mea_tuc, mea_tmv) with a bearer token from
   `POST /api/auth/login {"password": ...}` → `{token}`. CSV layouts are in
   `Anomaly-Dashboard-Backend/tests/test_smoke.py` (PEA: 2 header rows, BE
   months = CE year + 543; MEA: junk banner row + CE months, duplicated for
   amount/unit blocks). The latest month gets dropped as "incomplete billing
   cycle" — seed one month beyond what you want to see.

3. **Frontend**: Next 16 allows only ONE dev server per project dir — if the
   user already runs `npm run dev` (port 3000), a second `next dev` exits.
   Use a static export instead (this is the real deploy shape anyway):

   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run build
   ```

   The export lands in `out/` with basePath `/Anomaly-Dashboard`, so stage it
   as `<dir>/Anomaly-Dashboard` and serve: `npx serve <dir> -p 3002 -n`.
   Browse `http://localhost:3002/Anomaly-Dashboard/dashboard/`.

4. **Drive it** with Playwright (`chromium` is installed under
   `~/AppData/Local/ms-playwright`): fill `input[type=password]` with
   `localtest123`, click "Unlock", then interact.

## Flows worth driving

- Dashboard → pick an example site button (`button.font-mono`) → TrendChart
  renders; range presets are `radiogroup[name="Trend date range"]`.
- Detector → model must exist first; build it via API to skip form-driving:
  `POST /api/ml/build` with `{"train_start":201901,"train_end":202412,"test_start":202501,"test_end":202603,"q_low":0.05,"q_mid":0.5,"q_high":0.95}`.
  Then the flagged-anomalies table (step 5) has site-ID buttons → clicking
  scrolls to the step-6 trend panel (`.anomaly-ping-ring` marks the anomaly).

## Gotchas

- TaskStop on the uvicorn background task can orphan the python child on
  Windows — kill by port: `netstat -ano | grep :8000` → `taskkill //PID <pid> //F`.
- Recharts dots render only after the entrance animation (~700 ms); wait
  before asserting/screenshotting.
- Static export 404s two `.txt` RSC files in the console — pre-existing,
  harmless, not related to app code.
