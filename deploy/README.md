# Deploy

WL-Universe-style building blocks for Citrus.

## Pieces

| Path | Purpose |
|------|---------|
| `docker/` | Image Dockerfiles (`api`, `web`, `native`) |
| `compose/` | Prod Traefik compose templates (glados) |
| `local/` | Full laptop stack: Mongo + API + both UIs |

## Local

```bash
cp deploy/local/.env.example deploy/local/.env
docker compose -f deploy/local/docker-compose.yml --env-file deploy/local/.env up -d --build
```

Mongo persists in the `citrus_mongo_data` volume. API talks to `mongodb://mongo:27017`.

## Production (glados)

GitHub Actions (`publish-app-images.yml`):

1. Detects which of `api` / `web` / `native` / `mongo` catalog entries changed (mongo compose-only)
2. Builds & pushes `ghcr.io/<owner>/citrus-<app>:{latest,sha}`
3. Self-hosted runner labels: `self-hosted`, `glados`
4. Copies compose into `/opt/services/apps/<app>/compose.yml` and `up -d`

### Hostnames (Traefik labels)

| Host | Service |
|------|---------|
| `citrus.joed.dev` | web |
| `citrusnative.joed.dev` | native (Expo web export; native app later) |
| `api.citrus.joed.dev` | api |

Cloudflare Tunnel should point these at Traefik on glados (same as WL sites).

### Secrets / data (outside git)

```
/opt/services/data/app-env/citrus-api.env
/opt/services/data/app-env/citrus-web.env      # optional build-time only usually
/opt/services/data/app-assets/citrus-mongo/   # MongoDB volume
```

`citrus-api.env` must include at least:

```
MONGODB_URI=mongodb://citrus-mongo:27017
MONGODB_DB=citrus
GOOGLE_CLIENT_IDS=...
JWT_SECRET=...
CORS_ORIGINS=https://citrus.joed.dev,https://citrusnative.joed.dev
```

### Networks

- `proxy` — external Traefik network (apps)
- `citrus_internal` — API ↔ Mongo (not public)

Mongo compose joins `citrus_internal` only (no Traefik). API joins both.
