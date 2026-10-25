import { Candle, detectWyckoffSpring } from './backtest-indicators';
import { IndicatorConfig } from './backtest.types';

export interface SignalContext {
  candles: Candle[];
  index: number;
  config: IndicatorConfig;
  rsiValues: (number | null)[];
  emaFast: number[];
  emaSlow: number[];
  trendEma: number[];
  macroEma: number[];
  macdLine: number[];
  signalLine: number[];
}

export interface SignalResult {
  buySignal: boolean;
  setupNote: string;
  detectedRisk: number;
}

/**
 * Pengesan Isyarat Kuantitatif Mengikut Strategi
 */
export function detectStrategySignal(ctx: SignalContext): SignalResult {
  const { candles, index: i, config, rsiValues, emaFast, emaSlow, trendEma, macroEma, macdLine, signalLine } = ctx;
  const c = candles[i];
  const rsi = rsiValues[i];
  const prevRsi = rsiValues[i - 1];

  let buySignal = false;
  let setupNote = '';
  let detectedRisk = Math.max(0.02, Number((c.close * 0.028).toFixed(4)));

  const indType = config.type || (config as any).indicator;
  if (indType === 'MACD_MOMENTUM') {
    // Trend Filter: EMA 50 > EMA 100 dan harga berada di atas atau berdekatan EMA 50
    const uptrend = trendEma[i] > macroEma[i] && c.close >= trendEma[i] * 0.995;
    // MACD Line melintasi Signal Line dari bawah ke atas pada paras sifar/atas
    const macdCross = macdLine[i - 1] <= signalLine[i - 1] && macdLine[i] > signalLine[i];
    const macdNotDeep = macdLine[i] >= -0.05;
    buySignal = uptrend && macdCross && macdNotDeep;
    if (buySignal) {
      setupNote = `MACD Trend Momentum (MACD: ${macdLine[i].toFixed(3)} bersilang atas Signal: ${signalLine[i].toFixed(3)} di atas EMA 50/100)`;
      detectedRisk = Math.max(0.02, Number((c.close * 0.028).toFixed(4)));
    }
  } else if (indType === 'WYCKOFF_SPRING') {
    const spring = detectWyckoffSpring(
      candles,
      i,
      config.lookbackPeriod || 20,
      config.volumeMultiplier || 0.9,
      config.tailRatio || 0.5
    );
    // Sahkan fasa pengumpulan: pastikan berada dalam zon trend makro jika diaktifkan
    const trendOk = config.useTrendFilter !== false ? c.close >= macroEma[i] * 0.985 : true;
    buySignal = spring.isSpring && trendOk;
    if (buySignal) {
      setupNote = `Wyckoff Spring (Support: RM ${spring.support}, Sumbu: ${(spring.tailRatio * 100).toFixed(0)}%, Vol: ${spring.volRatio}x)`;
      const floor = spring.support > 0 ? spring.support : c.low;
      detectedRisk = Math.max(0.02, Number((c.close - floor + 0.01).toFixed(4)));
    }
  } else if (indType === 'EMA_CROSS') {
    buySignal = emaFast[i - 1] <= emaSlow[i - 1] && emaFast[i] > emaSlow[i];
    if (buySignal) {
      setupNote = 'EMA 9/21 Golden Cross';
      detectedRisk = Math.max(0.02, Number((c.close * 0.03).toFixed(4)));
    }
  } else {
    // RSI Oversold Reversion
    const buyLevel = config.buyThreshold || 38;
    buySignal = (rsi !== null && rsi < buyLevel) || (prevRsi !== null && prevRsi < buyLevel && rsi !== null && rsi > prevRsi);
    if (buySignal) {
      setupNote = `RSI Oversold (${rsi})`;
      detectedRisk = Math.max(0.02, Number((c.close * 0.03).toFixed(4)));
    }
  }

  return { buySignal, setupNote, detectedRisk };
}
