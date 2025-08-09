# Solona Monorepo

Monorepo with a NestJS API and a Next.js app.

## Apps
- apps/api: NestJS API with endpoint to get Solana block transaction count
- apps/web: Next.js app with a simple UI to query the API

## Requirements
- Node 20+
- pnpm (corepack enable && corepack use pnpm@latest)
- Optional: GitHub CLI (gh) for auto-pushing

## Setup
1. Install deps:

\n\tpnpm install

2. Run API (port 3000 by default):

\n\tpnpm dev:api

3. Run Web (port 3001 by default):

\n\tpnpm dev:web

Set NEXT_PUBLIC_API_URL in apps/web to point to the API if not http://localhost:3000.

### Solana RPC
Optionally set SOLANA_RPC_URL for a custom endpoint (default: https://api.mainnet-beta.solana.com).

## API
- GET /block/:slot/tx-count → { slot: number, transactionCount: number }

See `docs/solana-overview.md` for concepts (slots, blocks, verification steps).

## Tests
\n\tpnpm --filter api test

## Create GitHub Repo
If you have gh:
\n\tgh repo create solona-monorepo --public --source=. --remote=origin --push

Otherwise create a repo manually and run:
\n\tgit remote add origin <your-repo-url>
\tgit branch -M main
\tgit push -u origin main
