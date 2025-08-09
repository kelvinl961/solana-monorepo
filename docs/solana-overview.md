## Solana blocks, slots, and transaction counts

### What is a slot vs a block?
- A slot is a short time window on Solana (~400ms). A leader is scheduled per slot.
- If the leader produces a ledger entry, that slot contains a block. Some slots are skipped, so not every slot has a block.

### What is a transaction?
- A signed message that updates on-chain state (e.g., transfer SOL, interact with a program). One transaction can include multiple instructions, but still counts as a single transaction.

### What does this API return?
- For a given slot, it returns the number of transactions in that block.
- If the slot was skipped or is not available from the RPC (e.g., pruned/archived), the API returns `0` instead of failing.

### Endpoint
- GET `/block/:slot/tx-count` → `{ slot: number, transactionCount: number }`

### Where does the data come from?
- The API uses `@solana/web3.js` to call `getBlock(slot)` against the configured Solana RPC.
- By default it connects to mainnet: `https://api.mainnet-beta.solana.com`.
- You can override via `SOLANA_RPC_URL`.

### Caching and resiliency
- In-memory cache (TTL ~10s) reduces RPC calls for repeated queries.
- Errors for old/missing blocks are handled gracefully and return `0`.

## How to verify on mainnet

### 1) Call the API
```sh
curl -s http://localhost:3000/block/<SLOT>/tx-count
```

### 2) Call Solana JSON-RPC directly (same slot)
- Use explicit parameters to align with the API behavior:
  - `transactionDetails: 'full'`
  - `maxSupportedTransactionVersion: 0`
  - `commitment: 'confirmed'`

```sh
SLOT=<SLOT>
curl -s https://api.mainnet-beta.solana.com \
  -H 'content-type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBlock\",\"params\":[$SLOT,{\"maxSupportedTransactionVersion\":0,\"transactionDetails\":\"full\",\"commitment\":\"confirmed\"}]}" \
| jq '.result.transactions | length'
```

The number printed by `jq` should match `transactionCount` from our API for the same slot.

### Why direct RPC can show 0 if you omit params
- Some nodes return minimal data by default; without `transactionDetails: 'full'`, the `transactions` array may be absent or empty.
- Passing the explicit params ensures you get the same counting basis as the API.

## Configuration

### Environment variables
- `SOLANA_RPC_URL`: RPC endpoint to use. Defaults to mainnet (`https://api.mainnet-beta.solana.com`).
  - Devnet example: `https://api.devnet.solana.com`
  - Custom (Helius/QuickNode/etc) URLs are supported.

### Commitment
- The API uses a connection with `confirmed` commitment by default. You can switch to `finalized` if you need stricter finality.

## App structure quick reference
- NestJS API in `apps/api`, Next.js UI in `apps/web` (monorepo via pnpm workspaces).
- UI calls the API (not Solana directly). Set `NEXT_PUBLIC_API_URL` for non-local API hosts.

## FAQ
- What if the slot is skipped? The API returns `0` since there is no block.
- What if the slot is very old? It may be pruned by the node. The API returns `0` (resilient behavior).
- Does the API support other clusters? Yes—change `SOLANA_RPC_URL`.


