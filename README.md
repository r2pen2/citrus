# Citrus

Monorepo for Citrus Financial — shared API + both UIs, deployed WL-Universe style.

| Package | Role | Public host (prod) |
|---------|------|--------------------|
| `packages/api` | FastAPI + Mongo | `citrus-api.joed.dev` |
| `packages/web` | Citrus-V3 React (CRA) | **https://citrus.joed.dev** |
| `packages/native` | CitrusNative (Expo; web export for now) | **https://citrusnative.joed.dev** |

Auth: Firebase Google sign-in (same `citrus-v3` project / Firestore accounts). Mongo API JWT (`POST /auth/google`) is optional for future migration.

## Layout

```
citrus/
├── packages/
│   ├── api/          # FastAPI
│   ├── web/          # citrus.joed.dev
│   └── native/       # citrusnative.joed.dev (+ mobile later)
├── deploy/
│   ├── local/        # Full stack for laptop (API + Mongo + both UIs)
│   ├── docker/       # Image Dockerfiles
│   └── compose/      # Traefik / glados-style prod templates
├── scripts/          # Publish app catalog + change detection
└── .github/workflows/
```

## Local full stack (Docker)

Requires Docker Desktop.

```bash
cp deploy/local/.env.example deploy/local/.env
# edit GOOGLE_CLIENT_IDS + JWT_SECRET
npm run docker:local:up
```

| Service | URL |
|---------|-----|
| API docs | http://localhost:8000/docs |
| Web | http://localhost:3000 |
| Native (web export) | http://localhost:19006 |
| Mongo | `mongodb://localhost:27017` (db `citrus`) |

```bash
npm run docker:local:logs
npm run docker:local:down
```

## Local API only (no Docker)

```bash
cd packages/api
py -3 -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
# start Mongo somehow, then:
uvicorn app.main:app --reload --port 8000
```

## Production deploy (glados / Traefik)

Same pattern as [WL-Universe](https://github.com/r2pen2/WL-Universe):

1. GitHub Actions builds images → GHCR (`ghcr.io/<owner>/citrus-<app>`)
2. Self-hosted runner (`self-hosted`, `glados`) copies `deploy/compose/*.yml` → `/opt/services/apps/<app>/`
3. `docker compose pull && up -d`
4. Cloudflare Tunnel / Traefik host rules:
   - `citrus.joed.dev` → web
   - `citrusnative.joed.dev` → native
   - `citrus-api.joed.dev` → api
5. Secrets live in `/opt/services/data/app-env/` (never in git)
6. Mongo data: `/opt/services/data/app-assets/citrus-mongo/`

See [deploy/README.md](./deploy/README.md).

## Source lineage

- API ← [citrus-fastapi](https://github.com/r2pen2/citrus-fastapi)
- Web ← [Citrus-V3](https://github.com/r2pen2/Citrus-V3) `client/`
- Native ← [CitrusNative](https://github.com/r2pen2/CitrusNative)

Ongoing work happens **here**; those repos can stay as archives or mirrors.
