/**
 * Canonical publish / deploy catalog for the Citrus monorepo.
 * app slug === compose service stem (citrus-<app>).
 */

export const PUBLISH_APPS = [
  {
    app: "mongo",
    kind: "infra",
    compose: "deploy/compose/citrus-mongo.yml",
    // No GHCR image — upstream mongo:7
    image: false,
    watchPaths: ["deploy/compose/citrus-mongo.yml"],
  },
  {
    app: "api",
    kind: "api",
    port: 8000,
    dockerfile: "deploy/docker/api.Dockerfile",
    compose: "deploy/compose/citrus-api.yml",
    image: true,
    watchPaths: ["packages/api/", "deploy/docker/api.Dockerfile", "deploy/compose/citrus-api.yml"],
  },
  {
    app: "web",
    kind: "spa",
    port: 80,
    dockerfile: "deploy/docker/web.Dockerfile",
    compose: "deploy/compose/citrus-web.yml",
    image: true,
    host: "citrus.joed.dev",
    watchPaths: ["packages/web/", "deploy/docker/web.Dockerfile", "deploy/docker/nginx-spa.conf", "deploy/compose/citrus-web.yml"],
  },
  {
    app: "native",
    kind: "spa",
    port: 80,
    dockerfile: "deploy/docker/native.Dockerfile",
    compose: "deploy/compose/citrus-native.yml",
    image: true,
    host: "citrusnative.joed.dev",
    watchPaths: ["packages/native/", "deploy/docker/native.Dockerfile", "deploy/docker/nginx-spa.conf", "deploy/compose/citrus-native.yml"],
  },
];

export const APP_BY_NAME = Object.fromEntries(PUBLISH_APPS.map((a) => [a.app, a]));

export function imageName(owner, app) {
  return `ghcr.io/${owner.toLowerCase()}/citrus-${app}`;
}

export function dockerfileFor(appEntry) {
  return appEntry.dockerfile || null;
}
