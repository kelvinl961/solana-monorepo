import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Connection } from '@solana/web3.js';
import type { Cache } from 'cache-manager';

@Injectable()
export class SolanaService {
  private readonly connection: Connection;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
    const rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async getTransactionCountForSlot(slot: number): Promise<number> {
    const cacheKey = `txCount:${slot}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (typeof cached === 'number') return cached;

    // We fetch the block and count the transactions array length
    const block = await this.connection.getBlock(slot, {
      maxSupportedTransactionVersion: 0,
    });
    const count = block?.transactions?.length ?? 0;

    await this.cache.set(cacheKey, count, 10_000);
    return count;
  }
}


