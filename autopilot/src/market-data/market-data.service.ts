import { Injectable, BadRequestException } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { SUPPORTED_STOCKS, resolveStockSymbol, StockInfo } from './stocks.constant';

@Injectable()
export class MarketDataService {
  private yahoo = new YahooFinance({ suppressNotices: ['ripHistorical'] });

  /**
   * Senarai saham yang disokong (Bursa Malaysia, US, ID)
   */
  getStocks(market?: string): StockInfo[] {
    if (market && market !== 'ALL') {
      return SUPPORTED_STOCKS.filter(s => s.market === market.toUpperCase());
    }
    return SUPPORTED_STOCKS;
  }

  /**
   * Mengambil data lilin (Candlestick) bagi sesuatu simbol saham dengan sokongan pelbagai sela masa (1m, 5m, 15m, 1h, 1d, 1wk)
   */
  async getHistoricalData(symbol: string, period1?: string, period2?: string, interval: string = '1d') {
    if (!symbol) {
      throw new BadRequestException('Simbol saham diperlukan');
    }

    const resolvedSymbol = resolveStockSymbol(symbol);
    const stockInfo = SUPPORTED_STOCKS.find(s => s.symbol === resolvedSymbol);

    // Pemetaan selang masa Yahoo Finance
    let chartInterval: any = interval || '1d';
    if (chartInterval === '1h') chartInterval = '60m';
    if (chartInterval === '1w') chartInterval = '1wk';

    const isIntraday = ['1m', '2m', '5m', '15m', '30m', '60m', '90m'].includes(chartInterval);

    // Tetapkan tarikh lalai mengikut selang masa dengan had keselamatan Yahoo Finance
    let defaultPeriod1 = period1;
    if (chartInterval === '1m') {
      const minDate = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0];
      if (!defaultPeriod1 || defaultPeriod1 < minDate) {
        defaultPeriod1 = minDate;
      }
    } else if (['2m', '5m', '15m', '30m'].includes(chartInterval)) {
      const minDate = new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().split('T')[0];
      if (!defaultPeriod1 || defaultPeriod1 < minDate) {
        defaultPeriod1 = minDate;
      }
    } else if (chartInterval === '60m') {
      const minDate = new Date(Date.now() - 700 * 24 * 3600 * 1000).toISOString().split('T')[0];
      if (!defaultPeriod1 || defaultPeriod1 < minDate) {
        defaultPeriod1 = minDate;
      }
    } else if (!defaultPeriod1) {
      // Untuk lilin Harian (1d) dan Mingguan (1wk), muat turun data 4+ tahun (termasuk 2023, 2024, 2025, 2026)
      defaultPeriod1 = new Date(Date.now() - 1500 * 24 * 3600 * 1000).toISOString().split('T')[0];
    }
    const defaultPeriod2 = period2 || new Date().toISOString().split('T')[0];

    try {
      const result: any = await this.yahoo.chart(resolvedSymbol, {
        period1: defaultPeriod1,
        period2: defaultPeriod2,
        interval: chartInterval,
      });

      if (!result || !result.quotes || result.quotes.length === 0) {
        throw new Error(`Tiada data sejarah untuk simbol: ${resolvedSymbol}`);
      }

      // Format data untuk TradingView Lightweight Charts
      const candles = result.quotes
        .filter((q: any) => q.open !== null && q.close !== null && !isNaN(q.open) && !isNaN(q.close))
        .map((q: any) => {
          const d = new Date(q.date);
          const timeValue = isIntraday
            ? Math.floor(d.getTime() / 1000)
            : d.toISOString().split('T')[0];

          return {
            time: timeValue,
            open: Number(q.open.toFixed(4)),
            high: Number(q.high.toFixed(4)),
            low: Number(q.low.toFixed(4)),
            close: Number(q.close.toFixed(4)),
            volume: Number(q.volume || 0),
          };
        })
        .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.time === v.time) === i)
        .sort((a: any, b: any) =>
          typeof a.time === 'number' ? (a.time as number) - (b.time as number) : (a.time as string).localeCompare(b.time as string)
        );

      const meta = result.meta || {};
      const latestCandle = candles[candles.length - 1];
      const prevCandle = candles.length > 1 ? candles[candles.length - 2] : latestCandle;
      const currentPrice = meta.regularMarketPrice ?? latestCandle?.close ?? 0;
      const previousClose = meta.chartPreviousClose ?? prevCandle?.close ?? currentPrice;
      const change = currentPrice - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      return {
        symbol: resolvedSymbol,
        name: stockInfo?.name || meta.shortName || meta.symbol || resolvedSymbol,
        currency: stockInfo?.currency || meta.currency || 'MYR',
        market: stockInfo?.market || (resolvedSymbol.endsWith('.KL') ? 'MY' : 'US'),
        sector: stockInfo?.sector || 'Equities',
        interval: chartInterval,
        currentPrice: Number(currentPrice.toFixed(4)),
        change: Number(change.toFixed(4)),
        changePercent: Number(changePercent.toFixed(2)),
        high24h: meta.regularMarketDayHigh ?? latestCandle?.high ?? 0,
        low24h: meta.regularMarketDayLow ?? latestCandle?.low ?? 0,
        volume: meta.regularMarketVolume ?? latestCandle?.volume ?? 0,
        candles,
      };
    } catch (error: any) {
      throw new BadRequestException(`Gagal memuat turun data bagi ${symbol} (${resolvedSymbol}): ${error.message}`);
    }
  }
}
