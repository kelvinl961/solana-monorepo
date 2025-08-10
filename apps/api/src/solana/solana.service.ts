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

  async getLatestSlot(commitment: 'confirmed' | 'finalized' = 'confirmed'): Promise<number> {
    const cacheKey = `latestSlot:${commitment}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (typeof cached === 'number') return cached;
    const slot = await this.connection.getSlot(commitment);
    await this.cache.set(cacheKey, slot, 2);
    return slot;
  }

  async getTransactionCountForSlot(
    slot: number,
    commitment: 'confirmed' | 'finalized' = 'confirmed',
  ): Promise<number> {
    const cacheKey = `txCount:${slot}:${commitment}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (typeof cached === 'number') return cached;

    // Fetch the block and count the transactions. Handle nulls / RPC limitations gracefully
    let count = 0;
    try {
      const block = await this.connection.getBlock(slot, {
        maxSupportedTransactionVersion: 0,
        transactionDetails: 'full',
        commitment,
      } as any);
      count = block?.transactions?.length ?? 0;
    } catch (_err) {
      // Treat unavailable/old blocks as zero transactions instead of failing the API
      count = 0;
    }

    await this.cache.set(cacheKey, count, 10);
    return count;
  }

  async getBlockSummary(
    slot: number,
    commitment: 'confirmed' | 'finalized' = 'confirmed',
  ): Promise<{ slot: number; transactionCount: number; blockhash?: string; parentSlot?: number; blockTime?: number | null }>
  {
    const cacheKey = `blockSummary:${slot}:${commitment}`;
    const cached = await this.cache.get<{
      slot: number; transactionCount: number; blockhash?: string; parentSlot?: number; blockTime?: number | null
    }>(cacheKey);
    if (cached) return cached;

    let summary = { slot, transactionCount: 0, blockhash: undefined as string | undefined, parentSlot: undefined as number | undefined, blockTime: undefined as number | null | undefined };
    try {
      const block = await this.connection.getBlock(slot, {
        maxSupportedTransactionVersion: 0,
        transactionDetails: 'full',
        commitment,
      } as any);
      summary = {
        slot,
        transactionCount: block?.transactions?.length ?? 0,
        blockhash: (block as any)?.blockhash,
        parentSlot: (block as any)?.parentSlot,
        blockTime: (block as any)?.blockTime ?? null,
      };
    } catch (_err) {
      // leave defaults; indicates missing/unavailable block
    }

    await this.cache.set(cacheKey, summary, 10);
    return summary;
  }

  async getRecentCounts(
    limit: number,
    commitment: 'confirmed' | 'finalized' = 'confirmed',
  ): Promise<Array<{ slot: number; transactionCount: number }>> {
    const latest = await this.getLatestSlot(commitment);
    const results: Array<{ slot: number; transactionCount: number }> = [];
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    for (let i = 0; i < safeLimit; i += 1) {
      const slot = latest - i;
      if (slot < 0) break;
      const transactionCount = await this.getTransactionCountForSlot(slot, commitment);
      results.push({ slot, transactionCount });
    }
    return results;
  }

  async getRangeCounts(
    start: number,
    end: number,
    commitment: 'confirmed' | 'finalized' = 'confirmed',
  ): Promise<{
    start: number;
    end: number;
    slots: Array<{ slot: number; transactionCount: number }>;
    total: number;
    average: number;
    min: { slot: number; transactionCount: number } | null;
    max: { slot: number; transactionCount: number } | null;
  }> {
    const rangeStart = Math.max(0, Math.min(start, end));
    const rangeEnd = Math.max(0, Math.max(start, end));
    const slots: Array<{ slot: number; transactionCount: number }> = [];
    let total = 0;
    let min: { slot: number; transactionCount: number } | null = null;
    let max: { slot: number; transactionCount: number } | null = null;
    for (let s = rangeStart; s <= rangeEnd; s += 1) {
      const transactionCount = await this.getTransactionCountForSlot(s, commitment);
      const item = { slot: s, transactionCount };
      slots.push(item);
      total += transactionCount;
      if (!min || transactionCount < min.transactionCount) min = item;
      if (!max || transactionCount > max.transactionCount) max = item;
    }
    const average = slots.length > 0 ? total / slots.length : 0;
    return { start: rangeStart, end: rangeEnd, slots, total, average, min, max };
  }
}


