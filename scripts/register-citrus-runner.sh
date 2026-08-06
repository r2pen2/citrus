#!/usr/bin/env bash
# Register (or reconfigure) a GitHub Actions self-hosted runner for r2pen2/citrus
# on glados, with the same labels WL-Universe uses: self-hosted, glados.
#
# Usage (on glados):
#   export GH_TOKEN=ghp_...   # classic PAT with repo + admin:public_key OR use gh auth
#   # OR paste a short-lived registration token from:
#   #   https://github.com/r2pen2/citrus/settings/actions/runners/new
#   export RUNNER_TOKEN=...
#   bash scripts/register-citrus-runner.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/r2pen2/citrus}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner-citrus}"
RUNNER_NAME="${RUNNER_NAME:-glados-citrus}"
LABELS="${LABELS:-self-hosted,glados}"

if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    echo "Fetching registration token via gh..."
    RUNNER_TOKEN="$(gh api repos/r2pen2/citrus/actions/runners/registration-token -X POST --jq .token)"
  else
    echo "Set RUNNER_TOKEN from:"
    echo "  https://github.com/r2pen2/citrus/settings/actions/runners/new"
    exit 1
  fi
fi

mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

if [[ ! -f ./config.sh ]]; then
  echo "Downloading latest Linux x64 runner package..."
  # Pin via GitHub API latest release asset
  ver="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | sed -n 's/.*"tag_name": "v\([^"]*\)".*/\1/p' | head -1)"
  tar="actions-runner-linux-x64-${ver}.tar.gz"
  curl -fsSL -o "${tar}" "https://github.com/actions/runner/releases/download/v${ver}/${tar}"
  tar xzf "${tar}"
fi

# Remove prior citrus registration if present (safe if not configured)
./config.sh remove --token "${RUNNER_TOKEN}" >/dev/null 2>&1 || true

./config.sh \
  --unattended \
  --url "${REPO_URL}" \
  --token "${RUNNER_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --labels "${LABELS}" \
  --work _work

echo
echo "Configured ${RUNNER_NAME} for ${REPO_URL} with labels: ${LABELS}"
echo "Start it with one of:"
echo "  cd ${RUNNER_DIR} && ./run.sh"
echo "  # or install as a service:"
echo "  sudo ./svc.sh install && sudo ./svc.sh start"
echo
echo "Verify: https://github.com/r2pen2/citrus/settings/actions/runners"
