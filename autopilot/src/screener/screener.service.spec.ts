import { Test, TestingModule } from '@nestjs/testing';
import { ScreenerService } from './screener.service';
import { AiService } from '../ai/ai.service';
import { MarketDataService } from '../market-data/market-data.service';

describe('ScreenerService', () => {
  let service: ScreenerService;

  const mockAiService = {
    evaluateSymbol: jest.fn().mockResolvedValue({ recommendation: 'BUY' }),
  };

  const mockMarketDataService = {
    getHistoricalData: jest.fn().mockResolvedValue({ symbol: 'TEST_SYMBOL', candles: [{ close: 100 }] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreenerService,
        { provide: AiService, useValue: mockAiService },
        { provide: MarketDataService, useValue: mockMarketDataService },
      ],
    }).compile();

    service = module.get<ScreenerService>(ScreenerService);
  });

  it('sepatutnya memanggil AiService selepas mendapat data pasaran', async () => {
    const results = await service.runDailyScreener(['TEST_SYMBOL']);
    expect(mockMarketDataService.getHistoricalData).toHaveBeenCalled();
    expect(mockAiService.evaluateSymbol).toHaveBeenCalled();
    expect(results[0].recommendation).toEqual('BUY');
  });
});
