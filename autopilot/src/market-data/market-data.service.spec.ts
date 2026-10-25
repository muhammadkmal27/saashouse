import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataService } from './market-data.service';

jest.mock('yahoo-finance2', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chart: jest.fn().mockImplementation((symbol: string) => {
        if (symbol === 'INVALID_SYMBOL_123') {
          return Promise.reject(new Error('No data found, symbol may be delisted'));
        }
        return Promise.resolve({
          meta: { symbol, regularMarketPrice: 10.0, chartPreviousClose: 9.8 },
          quotes: [
            { date: new Date('2024-01-01'), open: 9.8, high: 10.1, low: 9.7, close: 10.0, volume: 1000000 },
          ],
        });
      }),
    };
  });
});

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketDataService],
    }).compile();

    service = module.get<MarketDataService>(MarketDataService);
  });

  it('sepatutnya memulangkan senarai saham yang disokong', () => {
    const stocks = service.getStocks();
    expect(stocks.length).toBeGreaterThan(10);
    const myStocks = service.getStocks('MY');
    expect(myStocks.every(s => s.market === 'MY')).toBe(true);
  });

  it('sepatutnya menolak jika simbol pasaran tidak sah', async () => {
    await expect(service.getHistoricalData('INVALID_SYMBOL_123', '2023-01-01', '2023-01-05'))
      .rejects
      .toThrow();
  });

  it('sepatutnya memulangkan data lilin bagi simbol sah (contoh: 1155.KL)', async () => {
    const data = await service.getHistoricalData('MAYBANK.KL');
    expect(data.symbol).toBe('1155.KL');
    expect(data.candles).toHaveLength(1);
    expect(data.currentPrice).toBe(10.0);
  });
});
