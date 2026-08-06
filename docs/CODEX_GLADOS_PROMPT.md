# Codex prompt — bring up Citrus on glados + register runner

Copy everything below the line into Codex on a machine that can SSH to glados.

---

Deploy Citrus on glados and register a GitHub Actions runner for `r2pen2/citrus`.

Context:
- Cloudflare already tunnels `citrus.joed.dev` / `citrusnative.joed.dev` to Traefik.
- Traefik returns plain `404 page not found` because no Citrus containers are running.
- The WL-Universe `glados` runner is repo-scoped to WL-Universe only. `r2pen2/citrus` has zero runners, so `deploy on glados` never runs.
- Repo: https://github.com/r2pen2/citrus

Do this on glados:

### 1) Clone / update
```bash
git clone https://github.com/r2pen2/citrus.git ~/citrus || (cd ~/citrus && git pull)
```

### 2) Docker networks
```bash
sudo docker network inspect proxy >/dev/null || { echo "FATAL: Traefik proxy network missing"; exit 1; }
sudo docker network inspect citrus_internal >/dev/null 2>&1 || sudo docker network create citrus_internal
```

### 3) API env secrets
```bash
sudo mkdir -p /opt/services/data/app-env /opt/services/data/app-assets/citrus-mongo
sudo cp ~/citrus/deploy/compose/citrus-api.env.example /opt/services/data/app-env/citrus-api.env
JWT=$(openssl rand -base64 48)
sudo sed -i "s|REPLACE_WITH_OPENSSL_RAND_BASE64_48|${JWT}|" /opt/services/data/app-env/citrus-api.env
# Set GOOGLE_CLIENT_IDS to real OAuth client IDs from Google Cloud Console
# (Web client ID is enough for web-only). Edit the file:
sudo nano /opt/services/data/app-env/citrus-api.env
```

### 4) GHCR login if packages are private
```bash
echo "$GHCR_TOKEN" | sudo docker login ghcr.io -u r2pen2 --password-stdin
```

### 5) Bring up stacks
```bash
bash ~/citrus/scripts/glados-bring-up.sh
sudo docker ps | grep citrus
curl -sI https://citrus.joed.dev/ | head
curl -sI https://citrus-api.joed.dev/health | head
```

### 6) Register self-hosted runner for r2pen2/citrus
Labels must be exactly: `self-hosted`, `glados` (same as WL-Universe).

```bash
cd ~/citrus && git pull
# Prefer: gh auth login as r2pen2, then:
bash scripts/register-citrus-runner.sh

# Or with a token from https://github.com/r2pen2/citrus/settings/actions/runners/new
# RUNNER_TOKEN=XXXX bash scripts/register-citrus-runner.sh

cd ~/actions-runner-citrus
sudo ./svc.sh install
sudo ./svc.sh start
```

Verify runner is **Idle**: https://github.com/r2pen2/citrus/settings/actions/runners

### 7) Re-run CI deploy
From GitHub → Actions → **Publish app images** → Run workflow → apps=`web,api,mongo` (or `all`).

Success criteria:
- `https://citrus.joed.dev/` is not Traefik `404 page not found`
- citrus runner visible and Idle on the citrus repo
- Publish workflow’s **deploy on glados** job succeeds
