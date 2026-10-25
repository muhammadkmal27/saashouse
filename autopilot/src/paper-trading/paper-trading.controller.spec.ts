import { Test, TestingModule } from '@nestjs/testing';
import { PaperTradingController } from './paper-trading.controller';
import { PaperTradingService } from './paper-trading.service';

describe('PaperTradingController', () => {
  let controller: PaperTradingController;

  const mockPaperTradingService = {
    getDashboardSummary: jest.fn(),
    createOrder: jest.fn(),
    closeOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaperTradingController],
      providers: [
        { provide: PaperTradingService, useValue: mockPaperTradingService },
      ],
    }).compile();

    controller = module.get<PaperTradingController>(PaperTradingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

