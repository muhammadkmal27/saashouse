import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { CryptoAutopilotService } from './crypto-autopilot.service';
import { CryptoMarketService } from './crypto-market.service';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: CryptoAutopilotService,
          useValue: {
            getStatus: jest.fn().mockReturnValue({ isRunning: false, balance: 100 }),
            start: jest.fn().mockReturnValue({ isRunning: true }),
            stop: jest.fn().mockReturnValue({ isRunning: false }),
            processPriceTick: jest.fn(),
            triggerAiOptimization: jest.fn(),
          },
        },
        {
          provide: CryptoMarketService,
          useValue: {
            getCryptoCandles: jest.fn().mockResolvedValue({ currentPrice: 360000, candles: [] }),
          },
        },
        {
          provide: AiService,
          useValue: {
            analyzeMarketRegime: jest.fn().mockResolvedValue({ regime: 'Bullish' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
