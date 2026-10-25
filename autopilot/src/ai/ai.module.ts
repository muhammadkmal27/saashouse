import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DeepSeekClient } from './deepseek.client';
import { CryptoAutopilotService } from './crypto-autopilot.service';
import { CryptoMarketService } from './crypto-market.service';

@Module({
  providers: [
    AiService,
    DeepSeekClient,
    CryptoAutopilotService,
    CryptoMarketService,
  ],
  controllers: [AiController],
  exports: [
    AiService,
    DeepSeekClient,
    CryptoAutopilotService,
    CryptoMarketService,
  ],
})
export class AiModule {}
