import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaperTradingService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, strategyId: string | undefined, symbol: string, type: string, entryPrice: number) {
    let validStrategyId = strategyId;
    if (validStrategyId) {
      const existing = await this.prisma.strategy.findFirst({ where: { id: validStrategyId, userId } });
      if (!existing) validStrategyId = undefined;
    }

    if (!validStrategyId) {
      let manualStrategy = await this.prisma.strategy.findFirst({ where: { userId, name: 'Manual Trading' } });
      if (!manualStrategy) {
        manualStrategy = await this.prisma.strategy.create({
          data: {
            userId,
            name: 'Manual Trading',
            type: 'MATH_ALGO',
            parameterConfig: { mode: 'manual' },
            status: 'ACTIVE',
          },
        });
      }
      validStrategyId = manualStrategy.id;
    }

    return this.prisma.paperTrade.create({
      data: {
        userId,
        strategyId: validStrategyId,
        symbol,
        type,
        entryPrice,
      },
    });
  }

  async closeOrder(userId: string, tradeId: string, exitPrice: number) {
    const trade = await this.prisma.paperTrade.findFirst({ where: { id: tradeId, userId, status: 'OPEN' } });
    if (!trade) throw new NotFoundException('Pesanan maya tidak sah atau sudah ditutup');

    let pnl = 0;
    if (trade.type === 'BUY') {
      pnl = exitPrice - trade.entryPrice;
    } else {
      pnl = trade.entryPrice - exitPrice;
    }

    return this.prisma.paperTrade.update({
      where: { id: tradeId },
      data: {
        exitPrice,
        status: 'CLOSED',
        pnl
      }
    });
  }

  async getDashboardSummary(userId: string) {
    const trades = await this.prisma.paperTrade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { strategy: true }
    });

    const closedTrades = await this.prisma.paperTrade.findMany({
      where: { userId, status: 'CLOSED' }
    });

    const totalEquity = 50000 + closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (winTrades / closedTrades.length) * 100 : 0;
    
    const activeStrategies = await this.prisma.strategy.findMany({
      where: { userId, status: 'ACTIVE' }
    });

    return {
      totalEquity,
      todaysPnl: closedTrades.slice(0, 5).reduce((sum, t) => sum + (t.pnl || 0), 0),
      winRate: Math.round(winRate),
      activeStrategy: activeStrategies.length > 0 ? activeStrategies[0].name : 'Tiada',
      recentTrades: trades
    };
  }
}
