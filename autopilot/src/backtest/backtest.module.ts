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
      connection: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue({ name: 'backtestQueue' }),
  ],
  providers: [BacktestService, BacktestProcessor],
  controllers: [BacktestController],
})
export class BacktestModule {}
