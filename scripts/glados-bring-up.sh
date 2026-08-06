#!/usr/bin/env bash
# Run on glados (SSH). Pulls GHCR images and starts Citrus Traefik stacks.
# Prereq: docker logged into ghcr.io if packages are private:
#   echo "$GHCR_TOKEN" | sudo docker login ghcr.io -u r2pen2 --password-stdin
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$HOME/citrus}"
OWNER="${OWNER:-r2pen2}"
TAG="${TAG:-latest}"

if [[ ! -d "${REPO_ROOT}/deploy/compose" ]]; then
  echo "Clone the repo first, e.g.:"
  echo "  git clone https://github.com/r2pen2/citrus.git ${REPO_ROOT}"
  exit 1
fi

sudo docker network inspect proxy >/dev/null 2>&1 || {
  echo "External docker network 'proxy' (Traefik) is missing."
  exit 1
}
sudo docker network inspect citrus_internal >/dev/null 2>&1 || sudo docker network create citrus_internal

order=(mongo api web native)
for app in "${order[@]}"; do
  dest="/opt/services/apps/citrus-${app}"
  sudo mkdir -p "${dest}"
  sudo cp "${REPO_ROOT}/deploy/compose/citrus-${app}.yml" "${dest}/compose.yml"

  case "${app}" in
    api) export CITRUS_API_IMAGE_TAG="${TAG}" ;;
    web) export CITRUS_WEB_IMAGE_TAG="${TAG}" ;;
    native) export CITRUS_NATIVE_IMAGE_TAG="${TAG}" ;;
  esac

  echo "==> citrus-${app}"
  if [[ "${app}" == "api" && ! -f /opt/services/data/app-env/citrus-api.env ]]; then
    echo "WARNING: missing /opt/services/data/app-env/citrus-api.env"
    echo "Copy from deploy/compose/citrus-api.env.example and fill secrets."
  fi
  sudo -E docker compose -f "${dest}/compose.yml" pull || true
  sudo -E docker compose -f "${dest}/compose.yml" up -d
done

echo "Done. Check: sudo docker ps | grep citrus"
echo "Then: curl -sI http://127.0.0.1 -H 'Host: citrus.joed.dev'  (via Traefik)"
