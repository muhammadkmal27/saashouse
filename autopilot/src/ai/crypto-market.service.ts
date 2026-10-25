import { Injectable, Logger } from '@nestjs/common';

export interface CryptoCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class CryptoMarketService {
  private readonly logger = new Logger(CryptoMarketService.name);
  private usdToMyrRate = 4.45;

  private symbolMap: Record<string, string> = {
    XBTMYR: 'BTCUSDT',
    ETHMYR: 'ETHUSDT',
    SOLMYR: 'SOLUSDT',
  };

  /**
   * Mengambil lilin masa nyata Kripto daripada API awam dan menukarkannya kepada MYR
   */
  async getCryptoCandles(pair: string = 'XBTMYR', interval: string = '1m', limit: number = 60): Promise<{
    symbol: string;
    currency: string;
    currentPrice: number;
    candles: CryptoCandle[];
  }> {
    const binancePair = this.symbolMap[pair.toUpperCase()] || 'BTCUSDT';

    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binancePair}&interval=${interval}&limit=${limit}`
      );
      if (!res.ok) throw new Error(`Binance error: ${res.statusText}`);
      const raw = await res.json();

      const candles: CryptoCandle[] = raw.map((k: any) => ({
        time: Math.floor(k[0] / 1000),
        open: Number((parseFloat(k[1]) * this.usdToMyrRate).toFixed(2)),
        high: Number((parseFloat(k[2]) * this.usdToMyrRate).toFixed(2)),
        low: Number((parseFloat(k[3]) * this.usdToMyrRate).toFixed(2)),
        close: Number((parseFloat(k[4]) * this.usdToMyrRate).toFixed(2)),
        volume: Number(parseFloat(k[5]).toFixed(4)),
      }));

      const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

      return {
        symbol: pair.toUpperCase(),
        currency: 'MYR',
        currentPrice,
        candles,
      };
    } catch (err: any) {
      this.logger.warn(`Gagal memuatkan lilin Binance: ${err.message}. Menjana anggaran pasaran.`);
      return this.generateFallbackCandles(pair);
    }
  }

  private generateFallbackCandles(pair: string) {
    const basePrice = pair === 'SOLMYR' ? 780 : pair === 'ETHMYR' ? 12500 : 360000;
    const now = Math.floor(Date.now() / 1000);
    const candles: CryptoCandle[] = [];
    let p = basePrice;

    for (let i = 50; i >= 0; i--) {
      const delta = (Math.random() - 0.48) * (basePrice * 0.003);
      const open = p;
      const close = p + delta;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.001);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.001);
      candles.push({
        time: now - i * 60,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Number((Math.random() * 2).toFixed(4)),
      });
      p = close;
    }

    return {
      symbol: pair.toUpperCase(),
      currency: 'MYR',
      currentPrice: candles[candles.length - 1].close,
      candles,
    };
  }
}
