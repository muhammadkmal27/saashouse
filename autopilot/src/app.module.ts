import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MarketDataModule } from './market-data/market-data.module';
import { PaperTradingModule } from './paper-trading/paper-trading.module';
import { StrategiesModule } from './strategies/strategies.module';
import { ScreenerModule } from './screener/screener.module';
import { AiModule } from './ai/ai.module';
import { BacktestModule } from './backtest/backtest.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, MarketDataModule, PaperTradingModule, StrategiesModule, ScreenerModule, AiModule, BacktestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
