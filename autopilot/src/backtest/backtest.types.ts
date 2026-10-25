import { Candle } from './backtest-indicators';

export interface IndicatorConfig {
  type: 'RSI' | 'EMA_CROSS' | 'WYCKOFF_SPRING' | 'MACD_MOMENTUM' | 'PRICE_ACTION';
  rsiPeriod?: number;
  buyThreshold?: number;     // e.g. 38 for RSI
  sellThreshold?: number;    // e.g. 65 for RSI
  fastEmaPeriod?: number;    // e.g. 9 for EMA or 12 for MACD
  slowEmaPeriod?: number;    // e.g. 21 for EMA or 26 for MACD
  signalPeriod?: number;     // e.g. 9 for MACD signal
  trendEmaPeriod?: number;   // e.g. 50
  macroEmaPeriod?: number;   // e.g. 100
  lookbackPeriod?: number;   // e.g. 20 for Wyckoff support
  volumeMultiplier?: number; // e.g. 0.9 for Wyckoff volume
  tailRatio?: number;        // e.g. 0.5 for Wyckoff pinbar tail
  useTrendFilter?: boolean;  // e.g. true for Wyckoff Spring trend confirmation
  maxHoldingDays?: number;   // e.g. 7 days for short swing
  maxHoldingBars?: number;   // e.g. 35-40 bars for 1h candles
}

export interface BacktestParams {
  symbol: string;
  timeframe?: string;         // e.g. '1h' (default), '1d', '15m'
  initialCapital: number;     // e.g. 5000
  targetProfit: number;       // e.g. 100 (Untung sasaran RM)
  stopLoss: number;           // e.g. 100 (Rugi sasaran RM)
  riskRewardRatio?: string;   // e.g. "1:1"
  indicatorConfig?: IndicatorConfig;
}

export interface TradeRecord {
  id: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  targetPrice?: number;
  stopPrice?: number;
  cost?: number;
  holdingDays?: number;
  entryRsi?: number;
  setupNote?: string;
  units: number;
  lots: number;
  type: 'BUY';
  result: 'WIN' | 'LOSS';
  pnl: number;
  balance: number;
  reason: string;
}

export interface BacktestResult {
  symbol: string;
  totalCandles: number;
  initialCapital: number;
  finalBalance: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  executionSummary?: string;
  tradeLogs: TradeRecord[];
  equityCurve: { date: string; balance: number }[];
}
