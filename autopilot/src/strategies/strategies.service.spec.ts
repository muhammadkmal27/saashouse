import { Test, TestingModule } from '@nestjs/testing';
import { StrategiesService } from './strategies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StrategiesService', () => {
  let service: StrategiesService;

  const mockPrisma = {
    strategy: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StrategiesService>(StrategiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sepatutnya memanggil findMany dengan userId yang betul (OLAC)', async () => {
    mockPrisma.strategy.findMany.mockResolvedValue([{ id: 'strat-1', name: 'MACD Scalp' }]);
    const result = await service.findAll('user-1');
    expect(mockPrisma.strategy.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(result).toHaveLength(1);
  });
});

