# Keep in sync with mise.toml (checked by `pnpm check:tool-versions`).
ARG NODE_VERSION=24.14.0
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"
RUN apk add --no-cache ca-certificates openssl
RUN corepack enable
# Keep in sync with mise.toml.
ARG PNPM_VERSION=10.30.3
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

FROM base AS prepare

# Keep in sync with turbo in pnpm-lock.yaml (checked by `pnpm check:tool-versions`).
# An older global turbo can reject keys in turbo.json.
ARG TURBO_VERSION=2.11.5
RUN pnpm add turbo@${TURBO_VERSION} --global
COPY . .
RUN turbo prune web --docker

FROM base AS builder

COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm turbo build

# Development target
FROM builder AS development

CMD ["pnpm", "--filter", "web", "dev"]

# Production target
FROM caddy:2-alpine AS production

COPY --from=prepare /app/apps/web/Caddyfile /etc/caddy/Caddyfile

COPY --from=builder /app/apps/web/dist /usr/share/caddy

EXPOSE 80
EXPOSE 443

