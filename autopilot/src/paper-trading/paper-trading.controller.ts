import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { PaperTradingService } from './paper-trading.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('api/paper-trading')
export class PaperTradingController {
  constructor(private ptService: PaperTradingService) {}

  @Get('dashboard')
  getDashboardSummary(@Request() req: any) {
    return this.ptService.getDashboardSummary(req.user.userId);
  }

  @Post('open')
  openOrder(@Request() req: any, @Body() body: { strategyId?: string, symbol: string, type: string, entryPrice: number }) {
    return this.ptService.createOrder(req.user.userId, body.strategyId, body.symbol, body.type, body.entryPrice);
  }

  @Post('close')
  closeOrder(@Request() req: any, @Body() body: { tradeId: string, exitPrice: number }) {
    return this.ptService.closeOrder(req.user.userId, body.tradeId, body.exitPrice);
  }
}
