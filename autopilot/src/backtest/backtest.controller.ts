import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { BacktestService, RunBacktestDto } from './backtest.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('api/backtest')
export class BacktestController {
  constructor(private readonly backtestService: BacktestService) {}

  @Post('run')
  runBacktest(@Request() req: any, @Body() body: RunBacktestDto) {
    return this.backtestService.runBacktest(req.user.userId, body);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.backtestService.getHistory(req.user.userId);
  }
}
