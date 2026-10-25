import {
  Candle,
  calculateBacktestRSI,
  calculateBacktestEMA,
  calculateBacktestMACD,
  detectWyckoffSpring,
  formatCandleTime,
  calculateTradePosition,
  calculateBacktestStats,
} from './backtest-indicators';
import {
  IndicatorConfig,
  BacktestParams,
  TradeRecord,
  BacktestResult,
} from './backtest.types';
import { detectStrategySignal } from './backtest-signal-detector';

export type { Candle, IndicatorConfig, BacktestParams, TradeRecord, BacktestResult };

export class BacktestEngine {
  static calculateRSI = calculateBacktestRSI;
  static calculateEMA = calculateBacktestEMA;
  static calculateMACD = calculateBacktestMACD;
  static detectWyckoffSpring = detectWyckoffSpring;

  static runSimulation(candles: Candle[], params: BacktestParams): BacktestResult {
    const {
      symbol,
      timeframe = '1h',
      initialCapital = 5000,
      stopLoss = 100,
      indicatorConfig = { type: 'MACD_MOMENTUM' },
    } = params;

    let balance = initialCapital;
    let peakBalance = initialCapital;
    let maxDrawdown = 0;

    const rsiPeriod = indicatorConfig.rsiPeriod || 14;
    const rsiValues = calculateBacktestRSI(candles, rsiPeriod);
    const emaFast = calculateBacktestEMA(candles, indicatorConfig.fastEmaPeriod || 9);
    const emaSlow = calculateBacktestEMA(candles, indicatorConfig.slowEmaPeriod || 21);
    const trendEma = calculateBacktestEMA(candles, indicatorConfig.trendEmaPeriod || 50);
    const macroEma = calculateBacktestEMA(candles, indicatorConfig.macroEmaPeriod || 100);
    const macd = calculateBacktestMACD(
      candles,
      indicatorConfig.fastEmaPeriod || 12,
      indicatorConfig.slowEmaPeriod || 26,
      indicatorConfig.signalPeriod || 9
    );

    const maxHoldingBars = indicatorConfig.maxHoldingBars || (timeframe === '1d' ? 7 : 35);
    const tradeLogs: TradeRecord[] = [];
    const equityCurve: { date: string; balance: number }[] = [
      { date: formatCandleTime(candles[0]?.time || 'start'), balance: initialCapital }
    ];

    let currentTrade: {
      entryDate: string | number;
      entryPrice: number;
      targetPrice: number;
      stopPrice: number;
      riskPerShare: number;
      cost: number;
      units: number;
      lots: number;
      entryIndex: number;
      entryRsi?: number;
      setupNote?: string;
    } | null = null;

    const startIndex = Math.max(rsiPeriod + 1, 101);

    for (let i = startIndex; i < candles.length; i++) {
      const c = candles[i];

      // 1. Semak pesanan terbuka untuk ditutup
      if (currentTrade) {
        let isClosed = false;
        let exitPrice = c.close;
        let outcome: 'WIN' | 'LOSS' = 'WIN';
        let pnl = 0;
        let reason = '';
        const holdingBars = i - currentTrade.entryIndex;

        if (c.high >= currentTrade.targetPrice) {
          isClosed = true;
          exitPrice = currentTrade.targetPrice;
          outcome = 'WIN';
          pnl = Number((currentTrade.units * (exitPrice - currentTrade.entryPrice)).toFixed(2));
          reason = `Sasaran Untung (TP 1:1) dicapai pada RM ${exitPrice.toFixed(4)} (+RM ${pnl.toFixed(2)})`;
        } else if (c.low <= currentTrade.stopPrice) {
          isClosed = true;
          exitPrice = currentTrade.stopPrice;
          outcome = 'LOSS';
          pnl = -Number((currentTrade.units * (currentTrade.entryPrice - exitPrice)).toFixed(2));
          reason = `Had Rugi (SL 1:1) dicapai pada RM ${exitPrice.toFixed(4)} (-RM ${Math.abs(pnl).toFixed(2)})`;
        } else if (holdingBars >= maxHoldingBars) {
          isClosed = true;
          exitPrice = c.close;
          pnl = Number(((exitPrice - currentTrade.entryPrice) * currentTrade.units).toFixed(2));
          outcome = pnl >= 0 ? 'WIN' : 'LOSS';
          const approxDays = Math.max(1, Math.round(holdingBars / 6));
          reason = `Tamat had pegangan short swing (${holdingBars} lilin / ~${approxDays} hari)`;
        }

        if (isClosed) {
          balance += pnl;
          if (balance > peakBalance) peakBalance = balance;
          const drawdown = ((peakBalance - balance) / peakBalance) * 100;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;

          tradeLogs.push({
            id: `bt-trade-${tradeLogs.length + 1}`,
            entryDate: formatCandleTime(currentTrade.entryDate),
            exitDate: formatCandleTime(c.time),
            entryPrice: currentTrade.entryPrice,
            exitPrice: Number(exitPrice.toFixed(4)),
            targetPrice: currentTrade.targetPrice,
            stopPrice: currentTrade.stopPrice,
            cost: currentTrade.cost,
            holdingDays: holdingBars,
            entryRsi: currentTrade.entryRsi,
            setupNote: currentTrade.setupNote,
            units: currentTrade.units,
            lots: currentTrade.lots,
            type: 'BUY',
            result: outcome,
            pnl: Number(pnl.toFixed(2)),
            balance: Number(balance.toFixed(2)),
            reason,
          });

          equityCurve.push({ date: formatCandleTime(c.time), balance: Number(balance.toFixed(2)) });
          currentTrade = null;
        }
      }

      // 2. Semak isyarat BELI jika tiada pesanan terbuka
      if (!currentTrade && i < candles.length - 1) {
        const sig = detectStrategySignal({
          candles,
          index: i,
          config: indicatorConfig,
          rsiValues,
          emaFast,
          emaSlow,
          trendEma,
          macroEma,
          macdLine: macd.macdLine,
          signalLine: macd.signalLine,
        });

        if (sig.buySignal && c.close > 0) {
          const pos = calculateTradePosition(c.close, balance, stopLoss, sig.detectedRisk);
          currentTrade = {
            entryDate: c.time,
            entryPrice: c.close,
            targetPrice: pos.targetPrice,
            stopPrice: pos.stopPrice,
            riskPerShare: pos.riskPerShare,
            cost: pos.cost,
            units: pos.units,
            lots: pos.lots,
            entryIndex: i,
            entryRsi: rsiValues[i] !== null ? Number(rsiValues[i]!.toFixed(1)) : undefined,
            setupNote: sig.setupNote,
          };
        }
      }
    }

    // 3. Jika ada pesanan masih terbuka pada lilin terakhir
    if (currentTrade && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const pnl = Number(((lastCandle.close - currentTrade.entryPrice) * currentTrade.units).toFixed(2));
      balance += pnl;
      tradeLogs.push({
        id: `bt-trade-${tradeLogs.length + 1}`,
        entryDate: formatCandleTime(currentTrade.entryDate),
        exitDate: formatCandleTime(lastCandle.time),
        entryPrice: currentTrade.entryPrice,
        exitPrice: lastCandle.close,
        targetPrice: currentTrade.targetPrice,
        stopPrice: currentTrade.stopPrice,
        cost: currentTrade.cost,
        holdingDays: (candles.length - 1) - currentTrade.entryIndex,
        entryRsi: currentTrade.entryRsi,
        setupNote: currentTrade.setupNote,
        units: currentTrade.units,
        lots: currentTrade.lots,
        type: 'BUY',
        result: pnl >= 0 ? 'WIN' : 'LOSS',
        pnl,
        balance: Number(balance.toFixed(2)),
        reason: `Tamat tempoh data simulasi (Ditutup pada harga pasaran semasa)`,
      });
      equityCurve.push({ date: formatCandleTime(lastCandle.time), balance: Number(balance.toFixed(2)) });
    }

    const stats = calculateBacktestStats(tradeLogs, initialCapital, balance);
    const tfLabel = timeframe === '1h' ? '1 Jam (Short Swing)' : timeframe === '15m' ? '15 Minit' : 'Harian';
    const executionSummary = `${candles.length} batang lilin ${tfLabel} telah diimbas bar-demi-bar sepanjang tempoh ujian. ` +
      (indicatorConfig.type === 'MACD_MOMENTUM'
        ? `Teknik MACD Trend Momentum Swing (Win Rate 60%+) menjejaki pembaharuan momentum dalam trend dengan nisbah 1:1 (~RM ${stopLoss}). Ditemui ${stats.totalTrades} transaksi (${stats.winningTrades} Menang / ${stats.losingTrades} Kalah, Win Rate: ${stats.winRate}%).`
        : `Ditemui ${stats.totalTrades} transaksi (${stats.winningTrades} Menang / ${stats.losingTrades} Kalah, Win Rate: ${stats.winRate}%).`);

    return {
      symbol,
      totalCandles: candles.length,
      initialCapital,
      finalBalance: Number(balance.toFixed(2)),
      netProfit: stats.netProfit,
      netProfitPercent: stats.netProfitPercent,
      totalTrades: stats.totalTrades,
      winningTrades: stats.winningTrades,
      losingTrades: stats.losingTrades,
      winRate: stats.winRate,
      profitFactor: stats.profitFactor,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      executionSummary,
      tradeLogs,
      equityCurve,
    };
  }
}
