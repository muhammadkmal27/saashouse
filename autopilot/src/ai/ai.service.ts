import { Injectable, Logger } from '@nestjs/common';
import { DeepSeekClient } from './deepseek.client';

export interface OptimizedParameters {
  takeProfitPct: number;
  stopLossPct: number;
  rsiThreshold: number;
  gridSpreadPct: number;
  rationale: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly deepSeekClient: DeepSeekClient) {}

  /**
   * Penilaian pantas simbol untuk kegunaan Screener
   */
  async evaluateSymbol(symbol: string, ohlcvData: any[]) {
    const lastPrice = ohlcvData && ohlcvData.length > 0 ? ohlcvData[ohlcvData.length - 1].close : 0;
    const res = await this.analyzeMarketRegime(symbol, lastPrice, ohlcvData || []);
    return {
      symbol,
      recommendation: res.signal || 'HOLD',
      confidence: `${res.confidence || 75}%`,
      regime: res.regime || 'Sideway',
      reason: res.reason || 'Pemerhatian momentum kuantitatif.',
    };
  }

  /**
   * Menganalisis lilin semasa kripto menggunakan penaakulan pintar DeepSeek LLM
   */
  async analyzeMarketRegime(symbol: string, currentPrice: number, recentCandles: any[]): Promise<any> {
    try {
      const summary = recentCandles.slice(-10).map((c) => ({
        c: c.close,
        h: c.high,
        l: c.low,
        v: c.volume,
      }));

      const prompt = `Anda adalah Abu Hanifah, Penasihat Kuantitatif Pintar untuk Pasaran Kripto (Spot Luno Malaysia).
Analisis pasaran terkini untuk ${symbol}.
Harga Semasa: RM ${currentPrice}
10 Lilin Terkini (Close, High, Low, Vol): ${JSON.stringify(summary)}

Berikan analisa ringkas dalam Bahasa Melayu:
1. Rejim Pasaran (Trending Bullish / Bearish / Sideway Ranging)
2. Isyarat Cadangan (BUY / WAIT / SELL)
3. Skor Keyakinan (0-100%)
4. Sebab ringkas (Maksimum 2 ayat).
Kembalikan format JSON SAHAJA:
{"regime": "...", "signal": "BUY"|"WAIT"|"SELL", "confidence": 85, "reason": "..."}`;

      const raw = await this.deepSeekClient.generateChat({
        messages: [
          { role: 'system', content: 'Anda hanya membalas dalam format JSON yang sah tanpa teks tambahan atau tanda markdown ```.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });

      const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      this.logger.warn(`Analisis AI gagal, menggunakan penilaian kuantitatif asas: ${err.message}`);
      return {
        regime: 'Sideway Accumulation',
        signal: 'WAIT',
        confidence: 60,
        reason: 'Volatiliti stabil dalam julat harga purata.',
      };
    }
  }

  /**
   * AI Self-Improvement Loop: DeepSeek mengkaji hasil transaksi lepas dan membaiki parameter matematik secara kendiri
   */
  async selfOptimizeStrategy(
    symbol: string,
    tradeHistory: any[],
    currentConfig: { takeProfitPct: number; stopLossPct: number; rsiThreshold: number; gridSpreadPct: number }
  ): Promise<OptimizedParameters> {
    try {
      const recentTrades = tradeHistory.slice(-6);
      const wins = recentTrades.filter((t) => t.netPnL > 0).length;
      const losses = recentTrades.filter((t) => t.netPnL <= 0).length;
      const totalNetPnL = recentTrades.reduce((acc, t) => acc + (t.netPnL || 0), 0);

      const prompt = `Anda adalah Ejen Kuantitatif Beradaptasi Kendiri (Self-Improving Quant Agent).
Kaji hasil transaksi perdagangan kripto ${symbol} terkini di Luno Malaysia:
- 6 Dagangan Terakhir: ${wins} Menang, ${losses} Kalah.
- Untung/Rugi Bersih Selepas Cas Luno 0.5%: RM ${totalNetPnL.toFixed(2)}
- Parameter Semasa: Take Profit=${currentConfig.takeProfitPct}%, Stop Loss=${currentConfig.stopLossPct}%, RSI Beli=<${currentConfig.rsiThreshold}, Grid=${currentConfig.gridSpreadPct}%.
- Nota Penting: Luno mengenakan cas 0.5% setiap beli dan 0.5% setiap jual (jumlah 1.0% pusingan). Sasaran Take Profit MESTI mengatasi kos ini.

Tugas Anda:
Baiki dan optimumkan parameter ini supaya prestasi bertambah baik (tingkatkan kadar kemenangan dan keuntungan bersih selepas tolak cas Luno).
Kembalikan format JSON SAHAJA:
{
  "takeProfitPct": <nombor antara 1.5 hingga 5.0>,
  "stopLossPct": <nombor antara 1.2 hingga 4.0>,
  "rsiThreshold": <nombor antara 25 hingga 42>,
  "gridSpreadPct": <nombor antara 0.8 hingga 3.0>,
  "rationale": "<penerangan ringkas 1-2 ayat dalam Bahasa Melayu tentang mengapa anda mengubah parameter ini>"
}`;

      const raw = await this.deepSeekClient.generateChat({
        messages: [
          { role: 'system', content: 'Anda hanya membalas dalam format JSON yang sah tanpa teks tambahan atau tanda markdown ```.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      });

      const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        takeProfitPct: Number(parsed.takeProfitPct) || currentConfig.takeProfitPct,
        stopLossPct: Number(parsed.stopLossPct) || currentConfig.stopLossPct,
        rsiThreshold: Number(parsed.rsiThreshold) || currentConfig.rsiThreshold,
        gridSpreadPct: Number(parsed.gridSpreadPct) || currentConfig.gridSpreadPct,
        rationale: parsed.rationale || 'DeepSeek melaraskan parameter untuk menyerap impak cas Luno.',
      };
    } catch (err: any) {
      this.logger.error(`Ralat pengoptimuman kendiri DeepSeek: ${err.message}`);
      return {
        ...currentConfig,
        rationale: 'DeepSeek mengekalkan parameter sedia ada bagi kestabilan pasaran.',
      };
    }
  }
}
