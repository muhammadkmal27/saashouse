import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { CryptoAutopilotService } from './crypto-autopilot.service';
import { CryptoMarketService } from './crypto-market.service';
import { AiService } from './ai.service';
import { DeepSeekClient } from './deepseek.client';

@Controller('api/ai')
export class AiController {
  constructor(
    private readonly autopilotService: CryptoAutopilotService,
    private readonly marketService: CryptoMarketService,
    private readonly aiService: AiService,
    private readonly deepSeek: DeepSeekClient,
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

  @Post('crypto/reset')
  resetAutopilot(@Body() body: { initialCapital?: number }) {
    return this.autopilotService.reset(Number(body?.initialCapital) || 100);
  }

  @Get('crypto/candles')
  async getCandles(
    @Query('symbol') symbol: string = 'XBTMYR',
    @Query('interval') interval: string = '1m',
    @Query('limit') limit: string = '60',
  ) {
    return this.marketService.getCryptoCandles(symbol, interval, Number(limit) || 60);
  }

  @Get('crypto/reasoning')
  async getReasoning(@Query('symbol') symbol: string = 'XBTMYR') {
    const market = await this.marketService.getCryptoCandles(symbol, '1m', 15);
    return this.aiService.analyzeMarketRegime(symbol, market.currentPrice, market.candles);
  }

  @Get('crypto/config/apikey')
  getApiKeyStatus() {
    return this.deepSeek.getMaskedApiKey();
  }

  @Post('crypto/config/apikey')
  updateApiKey(@Body() body: { apiKey: string }) {
    if (!body?.apiKey) {
      throw new BadRequestException('Sila masukkan Kunci API DeepSeek');
    }
    this.deepSeek.setApiKey(body.apiKey);
    return { success: true, ...this.deepSeek.getMaskedApiKey() };
  }
}
