import { Module } from '@nestjs/common';
import { ScreenerService } from './screener.service';
import { ScreenerController } from './screener.controller';

import { AiModule } from '../ai/ai.module';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [AiModule, MarketDataModule],
  providers: [ScreenerService],
  controllers: [ScreenerController]
})
export class ScreenerModule {}
