import { Test, TestingModule } from '@nestjs/testing';
import { BacktestController } from './backtest.controller';
import { BacktestService } from './backtest.service';

describe('BacktestController', () => {
  let controller: BacktestController;

  const mockBacktestService = {
    runBacktest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BacktestController],
      providers: [
        { provide: BacktestService, useValue: mockBacktestService },
      ],
    }).compile();

    controller = module.get<BacktestController>(BacktestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

