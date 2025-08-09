import { Module } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { SolanaController } from './solana.controller';

@Module({
  providers: [SolanaService],
  controllers: [SolanaController],
})
export class SolanaModule {}


