# PRJX Leaderboard — Manual Trigger Mode

No Vercel cron. You trigger the daily job yourself.

## Env vars
- `DATABASE_URL` (Neon / Supabase)
- `POSTGRES_URL` (same as DATABASE_URL)
- `CRON_KEY` (secret string)
- (After first deploy) `NEXT_PUBLIC_BASE_URL` = your URL

## Trigger the job
- **GET**: `https://<app>.vercel.app/api/cron/daily?key=<CRON_KEY>`
- **POST**:
  ```bash
  curl -X POST "https://<app>.vercel.app/api/cron/daily" -H "x-cron-key: <CRON_KEY>"
  ```
- Idempotence: if it already ran today, it returns "Already ran today". To force:
  - GET with `?force=1` (and key)
  - or POST with header + `?force=1`

## Populate
```bash
curl -X POST https://<app>.vercel.app/api/seed
curl -X POST https://<app>.vercel.app/api/upload-addresses -H "Content-Type: text/plain" --data-binary @addresses.txt
```
