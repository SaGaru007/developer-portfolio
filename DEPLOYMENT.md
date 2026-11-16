# Deployment

The app is a Vite frontend plus an Express API that owns a SQLite database and uploaded files.
Those two halves have different hosting needs, so they are deployed separately.

| Half | Host | Why |
| --- | --- | --- |
| `src/frontend` (Vite build) | **Vercel** | Static files on a CDN - no cold start, instant first paint |
| `src/server` (Express + SQLite + uploads) | **Render** | Needs a long-running process and a persistent disk |

## Why not the whole app on Vercel

Vercel runs serverless functions with an ephemeral, read-only filesystem (only `/tmp` is writable,
and it is wiped between invocations). This app keeps `portfolio.sqlite` and uploaded certificate
images on disk, so it cannot run there without replacing SQLite with a hosted database and uploads
with object storage.

## How the split stays one origin

Every frontend request uses a relative path (`fetch("/api/projects")`, `/uploads/...`), which is
what lets the same build work locally and in production. `vercel.json` keeps that property by
proxying those paths to Render, so no API base URL or CORS configuration is needed:

```
/api/*      -> https://portfolio-1-y0hc.onrender.com/api/*
/uploads/*  -> https://portfolio-1-y0hc.onrender.com/uploads/*
/resume     -> https://portfolio-1-y0hc.onrender.com/resume
```

The client-side routes fall through to `/index.html`.

If the Render service is renamed or moved, update those three destinations and redeploy.

## Vercel project settings

Import the repository and set the **root directory to `src/frontend`** with the **Vite** preset.
The frontend is a pnpm workspace package, so `src/frontend/vercel.json` installs from the
repository root and builds in place:

- Install: `cd ../.. && pnpm install --frozen-lockfile`
- Build: `pnpm build`
- Output: `dist`

## Downloads and bundled files

The resume and the certificate PDFs are committed under `src/frontend/public/files/`. Vercel
serves `public/` as static files, so these downloads never depend on the API, on an upload
surviving a restart, or on the service being awake.

The pages still read from the API first. When a request fails or a table is empty, the bundled
content in `src/frontend/src/data/portfolio-data.ts` fills the gap, which is what keeps the site
complete on a host whose disk is not persisted.

## Render settings

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for the admin panel. If unset, one is generated into `$DATA_DIR/admin-password.txt` |
| `DATA_DIR` | Directory holding `portfolio.sqlite`. Use the mounted disk, e.g. `/var/data` |
| `UPLOAD_DIR` | Directory for uploaded files, e.g. `/var/data/uploads` |
| `NODE_ENV` | `production`, which marks the session cookie `Secure` |

## Things to know before relying on it

- **Sessions are in memory.** `src/server/index.mjs` keeps sessions in a `Map`, so any restart or
  redeploy signs the admin out. Sign in again; nothing is lost.
- **Data needs a disk.** Render's **free** plan does not support persistent disks, so on free the
  SQLite file and uploads are wiped on every restart and every deploy. For content you actually
  maintain, run the service on the **Starter** plan and attach a disk at `/var/data`.
- **The admin password is a secret.** It lives in Render's environment settings, and locally in
  `data/admin-password.txt`, which is gitignored. Rotate it by changing `ADMIN_PASSWORD` on Render
  and redeploying.
