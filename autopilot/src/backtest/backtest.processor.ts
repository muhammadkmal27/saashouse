import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('backtestQueue')
export class BacktestProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, strategyId, symbol } = job.data;
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    const winRate = Math.random() * 100;
    await this.prisma.backtest.updateMany({
      where: { userId, strategyId, status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        winRate,
        totalTrades: 15,
        finalBalance: 10000 + (Math.random() * 5000),
      }
    });

    return { winRate };
  }
}
