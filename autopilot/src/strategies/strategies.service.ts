import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StrategiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: Omit<Prisma.StrategyCreateInput, 'user'>) {
    return this.prisma.strategy.create({
      data: { ...data, user: { connect: { id: userId } } },
    });
  }

  async findAll(userId: string) {
    const existing = await this.prisma.strategy.findMany({ where: { userId } });
    if (existing.length === 0) {
      const presets = [
        {
          userId,
          name: 'MACD Trend Momentum Swing',
          type: 'MATH_ALGO',
          status: 'ACTIVE',
          parameterConfig: {
            indicator: 'MACD_MOMENTUM',
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            trendEmaPeriod: 50,
            macroEmaPeriod: 100,
            riskRewardRatio: '1:1',
            targetProfit: 100,
            stopLoss: 100,
            defaultCapital: 5000,
            winRateTarget: '65%+',
            description: 'Teknik Short Swing berkeberkesanan tinggi (60% - 84% Win Rate). Beli apabila MACD bersilang naik di atas baseline dalam fasa kenaikan trend EMA 50/100.',
          },
        },
        {
          userId,
          name: 'Wyckoff Spring Short Swing',
          type: 'MATH_ALGO',
          status: 'ACTIVE',
          parameterConfig: {
            indicator: 'WYCKOFF_SPRING',
            lookbackPeriod: 20,
            volumeMultiplier: 0.9,
            tailRatio: 0.5,
            useTrendFilter: true,
            maxHoldingDays: 7,
            riskRewardRatio: '1:1',
            targetProfit: 100,
            stopLoss: 100,
            defaultCapital: 5000,
            winRateTarget: '60%+',
            description: 'Short Swing 2-7 hari berpandukan fasa pengumpulan Wyckoff (Spring) disahkan oleh trend makro untuk mencapai kadar kemenangan 60%+.',
          },
        },
        {
          userId,
          name: 'RSI 1:1 Scalp Reversion',
          type: 'MATH_ALGO',
          status: 'ACTIVE',
          parameterConfig: {
            indicator: 'RSI',
            rsiPeriod: 14,
            buyThreshold: 35,
            sellThreshold: 70,
            riskRewardRatio: '1:1',
            targetProfit: 100,
            stopLoss: 100,
            defaultCapital: 5000,
            description: 'Beli apabila RSI < 35 (Oversold), sasaran untung RM100 dan had rugi RM100 (Nisbah 1:1).',
          },
        },
        {
          userId,
          name: 'EMA 9/21 Trend Crossover',
          type: 'MATH_ALGO',
          status: 'INACTIVE',
          parameterConfig: {
            indicator: 'EMA_CROSS',
            fastEmaPeriod: 9,
            slowEmaPeriod: 21,
            riskRewardRatio: '1:2',
            targetProfit: 200,
            stopLoss: 100,
            defaultCapital: 5000,
            description: 'Beli apabila EMA 9 melintasi EMA 21, sasaran untung RM200 dan had rugi RM100 (Nisbah 1:2).',
          },
        },
        {
          userId,
          name: 'DeepSeek AI Momentum Agent',
          type: 'AI_API',
          status: 'ACTIVE',
          parameterConfig: {
            indicator: 'AI_AGENT',
            riskRewardRatio: '1:1.5',
            targetProfit: 150,
            stopLoss: 100,
            defaultCapital: 5000,
            description: 'Penaakulan corak lilin pintar oleh LLM DeepSeek berserta penunjuk teknikal.',
          },
        },
      ];

      for (const p of presets) {
        await this.prisma.strategy.create({ data: p });
      }

      return this.prisma.strategy.findMany({ where: { userId } });
    }

    const hasMacd = existing.some((s) => s.name.includes('MACD'));
    const hasWyckoff = existing.some((s) => s.name.includes('Wyckoff'));

    if (!hasMacd) {
      await this.prisma.strategy.create({
        data: {
          userId,
          name: 'MACD Trend Momentum Swing',
          type: 'MATH_ALGO',
          status: 'ACTIVE',
          parameterConfig: {
            indicator: 'MACD_MOMENTUM',
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            trendEmaPeriod: 50,
            macroEmaPeriod: 100,
            riskRewardRatio: '1:1',
            targetProfit: 100,
            stopLoss: 100,
            defaultCapital: 5000,
            winRateTarget: '65%+',
            description: 'Teknik Short Swing berkeberkesanan tinggi (60% - 84% Win Rate). Beli apabila MACD bersilang naik di atas baseline dalam fasa kenaikan trend EMA 50/100.',
          },
        },
      });
    }

    if (!hasWyckoff) {
      await this.prisma.strategy.create({
        data: {
          userId,
          name: 'Wyckoff Spring Short Swing',
          type: 'MATH_ALGO',
          status: 'ACTIVE',
          parameterConfig: {
            indicator: 'WYCKOFF_SPRING',
            lookbackPeriod: 20,
            volumeMultiplier: 0.9,
            tailRatio: 0.5,
            useTrendFilter: true,
            maxHoldingDays: 7,
            riskRewardRatio: '1:1',
            targetProfit: 100,
            stopLoss: 100,
            defaultCapital: 5000,
            winRateTarget: '60%+',
            description: 'Short Swing 2-7 hari berpandukan fasa pengumpulan Wyckoff (Spring) disahkan oleh trend makro untuk mencapai kadar kemenangan 60%+.',
          },
        },
      });
    }

    return this.prisma.strategy.findMany({ where: { userId } });
  }

  async findOne(userId: string, id: string) {
    const strategy = await this.prisma.strategy.findFirst({ where: { id, userId } });
    if (!strategy) throw new NotFoundException('Strategi tidak dijumpai');
    return strategy;
  }

  async update(userId: string, id: string, data: Prisma.StrategyUpdateInput) {
    const strategy = await this.prisma.strategy.findFirst({ where: { id, userId } });
    if (!strategy) throw new NotFoundException('Strategi tidak dijumpai atau akses ditolak');

    return this.prisma.strategy.update({ where: { id }, data });
  }

  async toggleStatus(userId: string, id: string) {
    const strategy = await this.findOne(userId, id);
    const newStatus = strategy.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.prisma.strategy.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}
