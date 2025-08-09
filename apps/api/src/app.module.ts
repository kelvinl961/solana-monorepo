import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SolanaModule } from './solana/solana.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 10,
      max: 100,
      isGlobal: true,
    }),
    SolanaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
