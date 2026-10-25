import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { BacktestEngine, BacktestParams, BacktestResult } from './backtest-engine';

export class RunBacktestDto {
  strategyId?: string;
  symbol: string;
  timeframe?: string; // '1h' (default), '1d', '15m'
  fromDate?: string;
  toDate?: string;
  initialCapital?: number;
  targetProfit?: number;
  stopLoss?: number;
  riskRewardRatio?: string;
  indicatorConfig?: any;
}

@Injectable()
export class BacktestService {
  constructor(
    private prisma: PrismaService,
    private marketDataService: MarketDataService,
  ) {}

  async runBacktest(userId: string, dto: RunBacktestDto): Promise<BacktestResult> {
    if (!dto.symbol) {
      throw new BadRequestException('Simbol saham diperlukan');
    }

    // 1. Dapatkan atau sahkan strategi
    let strategy = dto.strategyId
      ? await this.prisma.strategy.findFirst({ where: { id: dto.strategyId, userId } })
      : null;

    if (!strategy) {
      strategy = await this.prisma.strategy.findFirst({ where: { userId, status: 'ACTIVE' } });
      if (!strategy) {
        strategy = await this.prisma.strategy.create({
          data: {
            userId,
            name: 'Wyckoff Spring Short Swing',
            type: 'MATH_ALGO',
            status: 'ACTIVE',
            parameterConfig: {
              indicator: 'WYCKOFF_SPRING',
              lookbackPeriod: 20,
              volumeMultiplier: 0.9,
              tailRatio: 0.5,
              riskRewardRatio: '1:1',
              targetProfit: 100,
              stopLoss: 100,
              defaultCapital: 5000,
            },
          },
        });
      }
    }

    const stratConfig = (strategy.parameterConfig as any) || {};

    const initialCapital = Number(dto.initialCapital || stratConfig.defaultCapital || 5000);
    const targetProfit = Number(dto.targetProfit || stratConfig.targetProfit || 100);
    const stopLoss = Number(dto.stopLoss || stratConfig.stopLoss || 100);
    const riskRewardRatio = dto.riskRewardRatio || stratConfig.riskRewardRatio || '1:1';
    const timeframe = dto.timeframe || stratConfig.timeframe || '1h';

    const rawConfig = dto.indicatorConfig || stratConfig;
    const indicatorType = rawConfig.type || rawConfig.indicator || 'MACD_MOMENTUM';

    const indicatorConfig = {
      type: indicatorType,
      rsiPeriod: rawConfig.rsiPeriod || 14,
      buyThreshold: rawConfig.buyThreshold || 38,
      sellThreshold: rawConfig.sellThreshold || 65,
      fastEmaPeriod: rawConfig.fastEmaPeriod || (indicatorType === 'MACD_MOMENTUM' ? 12 : 9),
      slowEmaPeriod: rawConfig.slowEmaPeriod || (indicatorType === 'MACD_MOMENTUM' ? 26 : 21),
      signalPeriod: rawConfig.signalPeriod || 9,
      trendEmaPeriod: rawConfig.trendEmaPeriod || 50,
      macroEmaPeriod: rawConfig.macroEmaPeriod || 100,
      lookbackPeriod: rawConfig.lookbackPeriod || 20,
      volumeMultiplier: rawConfig.volumeMultiplier || 0.9,
      tailRatio: rawConfig.tailRatio || 0.5,
      useTrendFilter: rawConfig.useTrendFilter !== false,
      maxHoldingDays: rawConfig.maxHoldingDays || 7,
      maxHoldingBars: rawConfig.maxHoldingBars || (timeframe === '1d' ? 7 : 35),
    };

    // 2. Tarik data lilin sejarah dari MarketDataService
    const fromDate = dto.fromDate || '2024-01-01';
    const toDate = dto.toDate || new Date().toISOString().split('T')[0];

    const marketData = await this.marketDataService.getHistoricalData(dto.symbol, fromDate, toDate, timeframe);

    if (!marketData || !marketData.candles || marketData.candles.length === 0) {
      throw new BadRequestException(`Tiada data sejarah dijumpai bagi ${dto.symbol} antara ${fromDate} hingga ${toDate}`);
    }

    // 3. Jalankan Simulasi Enjin Kuantitatif Backtest
    const simulationParams: BacktestParams = {
      symbol: marketData.symbol,
      timeframe,
      initialCapital,
      targetProfit,
      stopLoss,
      riskRewardRatio,
      indicatorConfig,
    };

    const result = BacktestEngine.runSimulation(marketData.candles, simulationParams);

    // 4. Rekod keputusan ke dalam Pangkalan Data (Prisma OLAC)
    await this.prisma.backtest.create({
      data: {
        userId,
        strategyId: strategy.id,
        timeframe,
        initialCapital,
        finalBalance: result.finalBalance,
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        tradeLogs: result.tradeLogs as any,
        status: 'COMPLETED',
      },
    });

    return result;
  }

  async getHistory(userId: string) {
    return this.prisma.backtest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { strategy: true },
    });
  }
}
