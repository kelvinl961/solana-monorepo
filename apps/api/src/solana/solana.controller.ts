import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SolanaService } from './solana.service';

@Controller('block')
export class SolanaController {
  constructor(private readonly solanaService: SolanaService) {}

  @Get(':slot/tx-count')
  async getTxCount(@Param('slot', ParseIntPipe) slot: number) {
    const count = await this.solanaService.getTransactionCountForSlot(slot);
    return { slot, transactionCount: count };
  }
}


