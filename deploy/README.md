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
4. Copies compose into `/opt/services/apps/citrus-<app>/compose.yml` and `up -d`

### Critical: runner must be registered on **this** repo

The WL-Universe `glados` runner is **repo-scoped to WL-Universe**.  
`r2pen2/citrus` needs its **own** runner with labels `self-hosted`, `glados`, or CI deploy jobs queue forever and Traefik keeps returning `404 page not found`.

Cloudflare is fine if you already see Traefik’s plain `404 page not found` — tunnel works; **no container** has the Host rule yet. This is not an API wiring issue (`citrus.joed.dev` is the static web image).

### Register Actions runner on glados (required for CI)

On glados (after cloning this repo):

```bash
cd ~/citrus && git pull
# Option A: gh is logged in as r2pen2 (repo admin)
bash scripts/register-citrus-runner.sh

# Option B: paste a token from
#   https://github.com/r2pen2/citrus/settings/actions/runners/new
RUNNER_TOKEN=XXXX bash scripts/register-citrus-runner.sh

cd ~/actions-runner-citrus
sudo ./svc.sh install   # once
sudo ./svc.sh start
```

Confirm the runner shows **Idle** at  
https://github.com/r2pen2/citrus/settings/actions/runners  
Then re-run **Publish app images** (workflow_dispatch, apps=`all` or `web,api,mongo`).

### Manual bring-up (works without CI)

On glados:

```bash
git clone https://github.com/r2pen2/citrus.git ~/citrus   # or git pull
# if GHCR packages are private:
#   echo TOKEN | sudo docker login ghcr.io -u r2pen2 --password-stdin
sudo mkdir -p /opt/services/data/app-env /opt/services/data/app-assets/citrus-mongo
sudo cp ~/citrus/deploy/compose/citrus-api.env.example /opt/services/data/app-env/citrus-api.env
JWT=$(openssl rand -base64 48)
# put JWT into JWT_SECRET= and set GOOGLE_CLIENT_IDS= in citrus-api.env
sudo nano /opt/services/data/app-env/citrus-api.env
bash ~/citrus/scripts/glados-bring-up.sh
```

### Hostnames (Traefik labels)

| Host | Service |
|------|---------|
| `citrus.joed.dev` | web |
| `citrusnative.joed.dev` | native (Expo web export; native app later) |
| `api.citrus.joed.dev` | api (prefer renaming to `citrus-api.joed.dev` for `*.joed.dev` SSL) |

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
