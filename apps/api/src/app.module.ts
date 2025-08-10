import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SolanaModule } from './solana/solana.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [
      '.env.local',
      '.env.development.local',
      '.env.development',
      '.env.production.local',
      '.env.production',
      '.env',
    ] }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const hasRedis = !!process.env.REDIS_HOST;
        if (!hasRedis) {
          return {
            ttl: 10,
            max: 1000,
          };
        }
        return {
          ttl: 10,
          max: 1000,
          store: await redisStore({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: Number(process.env.REDIS_DB || '0'),
            keyPrefix: 'solona:',
          } as any),
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 60,
      },
    ]),
    SolanaModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
