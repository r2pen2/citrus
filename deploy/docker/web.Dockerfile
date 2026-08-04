# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:18-bookworm-slim

FROM ${NODE_IMAGE} AS builder
ARG REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
WORKDIR /app
COPY packages/web/package*.json ./
RUN npm ci --legacy-peer-deps
COPY packages/web/ ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY deploy/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
