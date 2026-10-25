import { Test, TestingModule } from '@nestjs/testing';
import { BacktestService } from './backtest.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';

describe('BacktestService', () => {
  let service: BacktestService;

  const mockPrisma = {
    strategy: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'strat-1',
        name: 'RSI 1:1 Scalp',
        parameterConfig: {
          indicator: 'RSI',
          rsiPeriod: 14,
          buyThreshold: 35,
          sellThreshold: 70,
          targetProfit: 100,
          stopLoss: 100,
          defaultCapital: 5000,
        },
      }),
      create: jest.fn(),
    },
    backtest: {
      create: jest.fn().mockResolvedValue({ id: 'bt-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const sampleCandles = Array.from({ length: 40 }, (_, i) => ({
    time: `2024-01-${String(i + 1).padStart(2, '0')}`,
    open: 10 + Math.sin(i) * 0.5,
    high: 10.5 + Math.sin(i) * 0.5,
    low: 9.5 + Math.sin(i) * 0.5,
    close: 10 + Math.sin(i + 1) * 0.5,
    volume: 100000,
  }));

  const mockMarketDataService = {
    getHistoricalData: jest.fn().mockResolvedValue({
      symbol: '1155.KL',
      candles: sampleCandles,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BacktestService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MarketDataService, useValue: mockMarketDataService },
      ],
    }).compile();

    service = module.get<BacktestService>(BacktestService);
  });

  it('sepatutnya menjalankan simulasi backtest dan mengira winrate', async () => {
    const res = await service.runBacktest('user-1', {
      symbol: '1155.KL',
      initialCapital: 5000,
      targetProfit: 100,
      stopLoss: 100,
      riskRewardRatio: '1:1',
    });

    expect(mockMarketDataService.getHistoricalData).toHaveBeenCalled();
    expect(mockPrisma.backtest.create).toHaveBeenCalled();
    expect(res).toBeDefined();
    expect(res.symbol).toBe('1155.KL');
    expect(res.initialCapital).toBe(5000);
    expect(typeof res.winRate).toBe('number');
  });
});
