import { Test, TestingModule } from '@nestjs/testing';
import { PaperTradingService } from './paper-trading.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaperTradingService', () => {
  let service: PaperTradingService;

  const mockPrisma = {
    strategy: { findFirst: jest.fn() },
    paperTrade: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaperTradingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaperTradingService>(PaperTradingService);
  });

  it('sepatutnya mengira PnL dengan tepat untuk pesanan BUY', async () => {
    mockPrisma.paperTrade.findFirst.mockResolvedValue({
      id: 'trade-1', entryPrice: 100, type: 'BUY', status: 'OPEN'
    });
    mockPrisma.paperTrade.update.mockResolvedValue({ pnl: 20 });
    
    await service.closeOrder('user-1', 'trade-1', 120);
    expect(mockPrisma.paperTrade.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ pnl: 20, status: 'CLOSED' })
    }));
  });
});
