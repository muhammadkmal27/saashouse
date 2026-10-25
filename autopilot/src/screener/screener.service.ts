import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { MarketDataService } from '../market-data/market-data.service';

@Injectable()
export class ScreenerService {
  constructor(
    private aiService: AiService,
    private marketDataService: MarketDataService
  ) {}

  async runDailyScreener(symbols: string[]) {
    const results: any[] = [];
    for (const symbol of symbols) {
      const data = await this.marketDataService.getHistoricalData(symbol, '2023-01-01', '2023-01-30').catch(() => null);
      if (data) {
        const evaluation = await this.aiService.evaluateSymbol(symbol, data.candles || []);
        results.push(evaluation);
      }
    }
    return results;
  }
}
