import { Controller, Get, Query } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Controller('api/market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('stocks')
  getStocks(@Query('market') market?: string) {
    return this.marketDataService.getStocks(market);
  }

  @Get('historical')
  async getHistorical(
    @Query('symbol') symbol: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('interval') interval?: string,
  ) {
    return this.marketDataService.getHistoricalData(symbol, from, to, interval);
  }
}
