# syntax=docker/dockerfile:1
# Expo web export for citrusnative.joed.dev (mobile binary stays EAS later).
ARG NODE_IMAGE=node:18-bookworm-slim

FROM ${NODE_IMAGE} AS builder
ARG REACT_APP_API_URL=http://localhost:8000
ARG EXPO_PUBLIC_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=${REACT_APP_API_URL} \
    EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL} \
    CI=1
WORKDIR /app
COPY packages/native/package*.json ./
RUN npm ci --legacy-peer-deps
COPY packages/native/ ./
# Expo 47 webpack export → web-build/
RUN npx expo export:web

FROM nginx:1.27-alpine AS runtime
COPY deploy/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web-build /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
