import { Test, TestingModule } from '@nestjs/testing';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';

describe('StrategiesController', () => {
  let controller: StrategiesController;

  const mockStrategiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrategiesController],
      providers: [
        { provide: StrategiesService, useValue: mockStrategiesService },
      ],
    }).compile();

    controller = module.get<StrategiesController>(StrategiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

