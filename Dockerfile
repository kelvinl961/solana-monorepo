# Dockerfile to build and run only the NestJS API located in apps/api

FROM node:20-alpine AS base
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Copy workspace manifests first for efficient installs
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/

# Install only API deps in the workspace context
RUN pnpm install --filter ./apps/api... --frozen-lockfile=false

# Copy API source and build
COPY apps/api ./apps/api
RUN pnpm --filter ./apps/api... build

ENV NODE_ENV=production
EXPOSE 3000

# Start the API in production mode
CMD ["pnpm","--filter","./apps/api...","start:prod"]


