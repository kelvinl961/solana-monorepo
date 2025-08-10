import { Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Query } from '@nestjs/common';
import { SolanaService } from './solana.service';

@Controller('block')
export class SolanaController {
  constructor(private readonly solanaService: SolanaService) {}

  @Get(':slot/tx-count')
  async getTxCount(
    @Param('slot', ParseIntPipe) slot: number,
    @Query('commitment', new ParseEnumPipe(['confirmed', 'finalized'], { optional: true })) commitment?: 'confirmed' | 'finalized',
  ) {
    const count = await this.solanaService.getTransactionCountForSlot(slot, commitment ?? 'confirmed');
    return { slot, transactionCount: count };
  }

  @Get('latest')
  async getLatest(
    @Query('commitment', new ParseEnumPipe(['confirmed', 'finalized'], { optional: true })) commitment?: 'confirmed' | 'finalized',
  ) {
    const slot = await this.solanaService.getLatestSlot(commitment ?? 'confirmed');
    return { slot };
  }

  @Get(':slot/summary')
  async getSummary(
    @Param('slot', ParseIntPipe) slot: number,
    @Query('commitment', new ParseEnumPipe(['confirmed', 'finalized'], { optional: true })) commitment?: 'confirmed' | 'finalized',
  ) {
    return this.solanaService.getBlockSummary(slot, commitment ?? 'confirmed');
  }
}


