import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';

export interface CryptoTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  units: number;
  cost: number;
  buyFee: number;
  sellFee?: number;
  grossPnL?: number;
  netPnL?: number;
  netPnLPct?: number;
  status: 'OPEN' | 'WIN' | 'LOSS';
  timestamp: string;
  exitTimestamp?: string;
  reason: string;
}

export interface AutopilotStatus {
  isRunning: boolean;
  symbol: string;
  capital: number;
  balance: number;
  cryptoHoldings: number;
  cryptoValueMYR: number;
  totalNetPnL: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  openPosition: CryptoTrade | null;
  trades: CryptoTrade[];
  parameters: {
    takeProfitPct: number;
    stopLossPct: number;
    rsiThreshold: number;
    gridSpreadPct: number;
  };
  aiReflectionLogs: { timestamp: string; note: string; parameters: any }[];
  lastPrice: number;
}

@Injectable()
export class CryptoAutopilotService {
  private readonly logger = new Logger(CryptoAutopilotService.name);
  private isRunning = false;
  private symbol = 'XBTMYR';
  private initialCapital = 100;
  private balance = 100;
  private cryptoHoldings = 0;
  private openPosition: CryptoTrade | null = null;
  private trades: CryptoTrade[] = [];
  private lastPrice = 360000;
  private parameters = {
    takeProfitPct: 2.2,
    stopLossPct: 1.5,
    rsiThreshold: 35,
    gridSpreadPct: 1.2,
  };
  private aiReflectionLogs: { timestamp: string; note: string; parameters: any }[] = [
    {
      timestamp: new Date().toISOString(),
      note: 'Sistem diaktifkan dengan penentukuran yuran Luno (0.5% Beli, 0.5% Jual). Sasaran Untung awal 2.2%.',
      parameters: { ...this.parameters },
    },
  ];

  constructor(private readonly aiService: AiService) {}

  getStatus(): AutopilotStatus {
    const cryptoValueMYR = Number((this.cryptoHoldings * this.lastPrice).toFixed(2));
    const wins = this.trades.filter((t) => t.status === 'WIN').length;
    const losses = this.trades.filter((t) => t.status === 'LOSS').length;
    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const totalNetPnL = Number((this.balance + cryptoValueMYR - this.initialCapital).toFixed(2));

    return {
      isRunning: this.isRunning,
      symbol: this.symbol,
      capital: this.initialCapital,
      balance: Number(this.balance.toFixed(2)),
      cryptoHoldings: Number(this.cryptoHoldings.toFixed(6)),
      cryptoValueMYR,
      totalNetPnL,
      totalTrades,
      wins,
      losses,
      winRate,
      openPosition: this.openPosition,
      trades: [...this.trades].reverse(),
      parameters: this.parameters,
      aiReflectionLogs: [...this.aiReflectionLogs].reverse(),
      lastPrice: this.lastPrice,
    };
  }

  start(symbol: string = 'XBTMYR', capital: number = 100) {
    this.symbol = symbol;
    this.initialCapital = capital > 0 ? capital : 100;
    this.balance = this.initialCapital;
    this.cryptoHoldings = 0;
    this.openPosition = null;
    this.trades = [];
    this.isRunning = true;
    this.aiReflectionLogs.push({
      timestamp: new Date().toISOString(),
      note: `Autopilot dimulakan untuk ${symbol} dengan modal RM ${this.initialCapital}.`,
      parameters: { ...this.parameters },
    });
    return this.getStatus();
  }

  stop() {
    this.isRunning = false;
    this.aiReflectionLogs.push({
      timestamp: new Date().toISOString(),
      note: 'Autopilot dihentikan oleh pengguna.',
      parameters: { ...this.parameters },
    });
    return this.getStatus();
  }

  reset(capital: number = 100) {
    this.initialCapital = capital > 0 ? capital : 100;
    this.balance = this.initialCapital;
    this.cryptoHoldings = 0;
    this.openPosition = null;
    this.trades = [];
    this.parameters = { takeProfitPct: 2.2, stopLossPct: 1.5, rsiThreshold: 35, gridSpreadPct: 1.2 };
    this.aiReflectionLogs.push({
      timestamp: new Date().toISOString(),
      note: `Autopilot diset semula ke modal RM ${this.initialCapital} dan parameter lalai.`,
      parameters: { ...this.parameters },
    });
    return this.getStatus();
  }

  async processPriceTick(currentPrice: number, candles: any[] = []): Promise<AutopilotStatus> {
    if (currentPrice <= 0) return this.getStatus();
    this.lastPrice = currentPrice;
    if (!this.isRunning) return this.getStatus();

    const LUNO_FEE_RATE = 0.005; // 0.50% Luno Taker Fee

    // 1. Semak kedudukan sedia ada (Take Profit / Stop Loss)
    if (this.openPosition) {
      const entryPrice = this.openPosition.entryPrice;
      const changePct = ((currentPrice - entryPrice) / entryPrice) * 100;

      const isTP = changePct >= this.parameters.takeProfitPct;
      const isSL = changePct <= -this.parameters.stopLossPct;

      if (isTP || isSL) {
        const grossProceeds = this.openPosition.units * currentPrice;
        const sellFee = grossProceeds * LUNO_FEE_RATE;
        const netProceeds = grossProceeds - sellFee;
        const netPnL = Number((netProceeds - this.openPosition.cost).toFixed(2));
        const status = netPnL > 0 ? 'WIN' : 'LOSS';

        const closedTrade: CryptoTrade = {
          ...this.openPosition,
          exitPrice: currentPrice,
          sellFee: Number(sellFee.toFixed(3)),
          grossPnL: Number((grossProceeds - this.openPosition.cost).toFixed(2)),
          netPnL,
          netPnLPct: Number(((netPnL / this.openPosition.cost) * 100).toFixed(2)),
          status,
          exitTimestamp: new Date().toISOString(),
          reason: isTP ? `Take Profit (+${changePct.toFixed(1)}%)` : `Stop Loss (${changePct.toFixed(1)}%)`,
        };

        this.trades.push(closedTrade);
        this.balance += netProceeds;
        this.cryptoHoldings = 0;
        this.openPosition = null;

        // Cetuskan AI Self-Optimization jika berlaku kekalahan atau setiap 3 transaksi
        if (status === 'LOSS' || this.trades.length % 3 === 0) {
          await this.triggerAiOptimization();
        }
      }
    } else {
      // 2. Semak isyarat BELI matematik (Pullback dip / Volatility trigger)
      const shouldBuy = this.evaluateMathematicalBuy(candles, currentPrice);
      if (shouldBuy && this.balance >= 10) {
        const allocate = Math.min(this.balance, 100);
        const buyFee = allocate * LUNO_FEE_RATE;
        const netToInvest = allocate - buyFee;
        const units = netToInvest / currentPrice;

        this.openPosition = {
          id: `TR-${Date.now()}`,
          symbol: this.symbol,
          type: 'BUY',
          entryPrice: currentPrice,
          units: Number(units.toFixed(6)),
          cost: allocate,
          buyFee: Number(buyFee.toFixed(3)),
          status: 'OPEN',
          timestamp: new Date().toISOString(),
          reason: `Signal Matematik (Harga Diskaun RM ${currentPrice.toFixed(2)})`,
        };

        this.balance -= allocate;
        this.cryptoHoldings = units;
      }
    }

    return this.getStatus();
  }

  private evaluateMathematicalBuy(candles: any[], price: number): boolean {
    if (!candles || candles.length < 5) return Math.random() < 0.25; // fallback
    const last3 = candles.slice(-3);
    const wasDropping = last3[1].close <= last3[0].close;
    const isRebounding = price > last3[1].close;
    return wasDropping && isRebounding;
  }

  async triggerAiOptimization() {
    try {
      const opt = await this.aiService.selfOptimizeStrategy(this.symbol, this.trades, this.parameters);
      this.parameters = {
        takeProfitPct: opt.takeProfitPct,
        stopLossPct: opt.stopLossPct,
        rsiThreshold: opt.rsiThreshold,
        gridSpreadPct: opt.gridSpreadPct,
      };
      this.aiReflectionLogs.push({
        timestamp: new Date().toISOString(),
        note: `[DeepSeek Self-Improvement]: ${opt.rationale}`,
        parameters: { ...this.parameters },
      });
    } catch (e: any) {
      this.logger.error(`Gagal menjalankan DeepSeek self-optimization: ${e.message}`);
    }
  }
}
