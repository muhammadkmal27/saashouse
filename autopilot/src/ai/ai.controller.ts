import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CryptoAutopilotService } from './crypto-autopilot.service';
import { CryptoMarketService } from './crypto-market.service';
import { AiService } from './ai.service';

@Controller('api/ai')
export class AiController {
  constructor(
    private readonly autopilotService: CryptoAutopilotService,
    private readonly marketService: CryptoMarketService,
    private readonly aiService: AiService,
  ) {}

  @Get('crypto/status')
  getStatus() {
    return this.autopilotService.getStatus();
  }

  @Post('crypto/start')
  startAutopilot(@Body() body: { symbol?: string; initialCapital?: number }) {
    return this.autopilotService.start(body?.symbol || 'XBTMYR', Number(body?.initialCapital) || 100);
  }

  @Post('crypto/stop')
  stopAutopilot() {
    return this.autopilotService.stop();
  }

  @Get('crypto/candles')
  async getCandles(
    @Query('symbol') symbol: string = 'XBTMYR',
    @Query('interval') interval: string = '1m',
    @Query('limit') limit: string = '60',
  ) {
    return this.marketService.getCryptoCandles(symbol, interval, Number(limit) || 60);
  }

  @Post('crypto/tick')
  async processTick(@Body() body: { symbol?: string; price?: number }) {
    const symbol = body?.symbol || 'XBTMYR';
    let currentPrice = body?.price;

    let candles: any[] = [];
    if (!currentPrice || currentPrice <= 0) {
      const market = await this.marketService.getCryptoCandles(symbol, '1m', 15);
      currentPrice = market.currentPrice;
      candles = market.candles;
    }

    return this.autopilotService.processPriceTick(currentPrice, candles);
  }

  @Post('crypto/optimize')
  async triggerOptimize() {
    await this.autopilotService.triggerAiOptimization();
    return this.autopilotService.getStatus();
  }

  @Post('crypto/analyze')
  async analyzeMarket(@Body() body: { symbol?: string; price?: number }) {
    const symbol = body?.symbol || 'XBTMYR';
    const market = await this.marketService.getCryptoCandles(symbol, '1m', 15);
    return this.aiService.analyzeMarketRegime(symbol, body?.price || market.currentPrice, market.candles);
  }
}
