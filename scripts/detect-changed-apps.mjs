#!/usr/bin/env node
/**
 * Detect which Citrus apps changed between two git SHAs.
 * Usage: node scripts/detect-changed-apps.mjs --base <sha> --head <sha> [--json]
 */
import { execSync } from "node:child_process";
import { PUBLISH_APPS } from "./apps.mjs";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

const base = arg("--base");
const head = arg("--head", "HEAD");
const asJson = process.argv.includes("--json");

if (!base) {
  console.error("Missing --base");
  process.exit(1);
}

const files = execSync(`git diff --name-only ${base}...${head}`, { encoding: "utf8" })
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

const sharedTriggers = [
  "deploy/docker/",
  "scripts/",
  ".github/workflows/publish-app-images.yml",
  "package.json",
];

const sharedHit = files.some((f) => sharedTriggers.some((p) => f === p || f.startsWith(p)));

const apps = [];
for (const entry of PUBLISH_APPS) {
  const hit =
    sharedHit ||
    files.some((f) => (entry.watchPaths || []).some((p) => f === p || f.startsWith(p)));
  if (hit) apps.push(entry.app);
}

// Shared docker/nginx change shouldn't force mongo infra redeploy unless its compose changed
const filtered = apps.filter((name) => {
  if (name !== "mongo") return true;
  return files.some((f) => f.startsWith("deploy/compose/citrus-mongo.yml"));
});

// If only shared infra scripts changed, still rebuild image apps
const finalApps =
  filtered.length > 0
    ? filtered
    : sharedHit
      ? PUBLISH_APPS.filter((a) => a.image !== false).map((a) => a.app)
      : [];

const unique = [...new Set(finalApps)];
const payload = { apps: unique, files, scope: "publish" };

if (asJson) {
  process.stdout.write(JSON.stringify(payload));
} else {
  console.log(unique.join(",") || "(none)");
}
