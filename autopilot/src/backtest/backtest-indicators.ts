export interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Format masa lilin sama ada string (YYYY-MM-DD) atau timestamp Unix (saat)
 */
export function formatCandleTime(time: string | number): string {
  if (typeof time === 'number') {
    const d = new Date(time * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }
  return String(time);
}

/**
 * Mengira Relative Strength Index (RSI) secara pantas bagi lilin sejarah
 */
export function calculateBacktestRSI(candles: Candle[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = new Array(candles.length).fill(null);
  if (!candles || candles.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - (100 / (1 + firstRS));

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = Number((100 - (100 / (1 + rs))).toFixed(2));
    }
  }

  return rsi;
}

/**
 * Mengira Exponential Moving Average (EMA)
 */
export function calculateBacktestEMA(candles: Candle[], period: number): number[] {
  if (!candles || candles.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [candles[0].close];

  for (let i = 1; i < candles.length; i++) {
    const current = (candles[i].close * k) + (ema[i - 1] * (1 - k));
    ema.push(Number(current.toFixed(4)));
  }

  return ema;
}

/**
 * Mengira Moving Average Convergence Divergence (MACD)
 */
export function calculateBacktestMACD(candles: Candle[], fast: number = 12, slow: number = 26, signal: number = 9) {
  const emaFast = calculateBacktestEMA(candles, fast);
  const emaSlow = calculateBacktestEMA(candles, slow);
  const macdLine: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    macdLine.push(Number((emaFast[i] - emaSlow[i]).toFixed(4)));
  }
  const k = 2 / (signal + 1);
  const signalLine: number[] = [macdLine[0] || 0];
  for (let i = 1; i < macdLine.length; i++) {
    signalLine.push(Number((macdLine[i] * k + signalLine[i - 1] * (1 - k)).toFixed(4)));
  }
  return { macdLine, signalLine };
}

export interface WyckoffSpringSignal {
  isSpring: boolean;
  support: number;
  tailRatio: number;
  volRatio: number;
}

/**
 * Mengesan setup Wyckoff Spring (Phase C Shakeout & Reclaim)
 * Syarat Kuantitatif:
 * 1. Penetration: Harga terendah (Low) menembusi paras sokongan julat (Support)
 * 2. Reclaim: Harga penutup (Close) berjaya ditolak naik semula melepasi atau sama Support
 * 3. Bullish Tail: Sumbu bawah lilin sekurang-kurangnya 50% daripada julat penuh bar
 * 4. Volume Confirmation: Volum melebihi purata volum 20 hari (Institutional absorption)
 */
export function detectWyckoffSpring(
  candles: Candle[],
  index: number,
  lookback: number = 20,
  volumeMultiplier: number = 0.9,
  tailThreshold: number = 0.5
): WyckoffSpringSignal {
  if (index < lookback) {
    return { isSpring: false, support: 0, tailRatio: 0, volRatio: 0 };
  }

  const c = candles[index];
  const prevCandles = candles.slice(index - lookback, index);
  const support = Math.min(...prevCandles.map((p) => p.low));
  const volSma = prevCandles.reduce((s, p) => s + p.volume, 0) / lookback;

  const barRange = c.high - c.low;
  const tailRatio = barRange > 0 ? (c.close - c.low) / barRange : 0;
  const volRatio = volSma > 0 ? c.volume / volSma : 1;

  const breached = c.low < support;
  const reclaimed = c.close >= support;
  const strongTail = tailRatio >= tailThreshold;
  const validVolume = volRatio >= volumeMultiplier;

  const isSpring = breached && reclaimed && strongTail && validVolume;

  return {
    isSpring,
    support: Number(support.toFixed(4)),
    tailRatio: Number(tailRatio.toFixed(2)),
    volRatio: Number(volRatio.toFixed(2)),
  };
}

export interface PositionSizingResult {
  riskPerShare: number;
  lots: number;
  units: number;
  targetPrice: number;
  stopPrice: number;
  cost: number;
}

/**
 * Mengira saiz lot Bursa Malaysia (1 lot = 100 unit) mengikut sasaran risiko/ganjaran (~RM 100)
 */
export function calculateTradePosition(
  price: number,
  balance: number,
  targetRiskRM: number,
  detectedRiskDistance: number
): PositionSizingResult {
  const minRisk = Math.max(0.015, Number((price * 0.02).toFixed(4)));
  const maxRisk = Math.max(0.03, Number((price * 0.045).toFixed(4)));
  const riskPerShare = Number(Math.min(Math.max(detectedRiskDistance, minRisk), maxRisk).toFixed(4));

  const riskPerLot = riskPerShare * 100;
  const desiredLots = Math.max(1, Math.round(targetRiskRM / riskPerLot));
  const costPerLot = price * 100;
  const maxLots = Math.max(1, Math.floor((balance * 0.95) / costPerLot));
  const lots = Math.min(desiredLots, maxLots);
  const units = lots * 100;

  return {
    riskPerShare,
    lots,
    units,
    targetPrice: Number((price + riskPerShare).toFixed(4)),
    stopPrice: Number((price - riskPerShare).toFixed(4)),
    cost: Number((price * units).toFixed(2)),
  };
}

/**
 * Mengira metrik statistik keseluruhan simulasi
 */
export function calculateBacktestStats(
  tradeLogs: { result: string; pnl: number }[],
  initialCapital: number,
  finalBalance: number
) {
  const winningTrades = tradeLogs.filter(t => t.result === 'WIN').length;
  const losingTrades = tradeLogs.filter(t => t.result === 'LOSS').length;
  const totalTrades = tradeLogs.length;
  const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;
  const netProfit = Number((finalBalance - initialCapital).toFixed(2));
  const netProfitPercent = Number(((netProfit / initialCapital) * 100).toFixed(2));
  const totalGain = tradeLogs.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(tradeLogs.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLoss > 0 ? Number((totalGain / totalLoss).toFixed(2)) : totalGain > 0 ? 99 : 1;

  return { winningTrades, losingTrades, totalTrades, winRate, netProfit, netProfitPercent, profitFactor };
}
