import { Test, TestingModule } from '@nestjs/testing';
import { ScreenerController } from './screener.controller';
import { ScreenerService } from './screener.service';

describe('ScreenerController', () => {
  let controller: ScreenerController;

  const mockScreenerService = {
    runDailyScreener: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScreenerController],
      providers: [
        { provide: ScreenerService, useValue: mockScreenerService },
      ],
    }).compile();

    controller = module.get<ScreenerController>(ScreenerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

