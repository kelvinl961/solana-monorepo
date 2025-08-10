import { Controller, Get, Header, Param, ParseEnumPipe, ParseIntPipe, Query, Res } from '@nestjs/common';
import { SolanaService } from './solana.service';
import type { Response } from 'express';
import { toCsv } from '../csv.util';

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

  @Get('range/:start/:end.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="range.csv"')
  async downloadRangeCsv(
    @Param('start', ParseIntPipe) start: number,
    @Param('end', ParseIntPipe) end: number,
    @Query('commitment', new ParseEnumPipe(['confirmed', 'finalized'], { optional: true })) commitment: 'confirmed' | 'finalized' = 'confirmed',
    @Res() res: Response,
  ) {
    const data = await this.solanaService.getRangeCounts(start, end, commitment);
    const rows = data.slots.map(s => ({ slot: s.slot, transactionCount: s.transactionCount }));
    const csv = toCsv(rows);
    res.send(csv);
  }
}


