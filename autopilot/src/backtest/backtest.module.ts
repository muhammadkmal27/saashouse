import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BacktestService } from './backtest.service';
import { BacktestController } from './backtest.controller';
import { BacktestProcessor } from './backtest.processor';

import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [
    MarketDataModule,
    BullModule.forRoot({
      connection: { host: process.env.REDIS_HOST || 'redis', port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379 },
    }),
    BullModule.registerQueue({ name: 'backtestQueue' }),
  ],
  providers: [BacktestService, BacktestProcessor],
  controllers: [BacktestController],
})
export class BacktestModule {}
