import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ScreenerService } from './screener.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('api/screener')
export class ScreenerController {
  constructor(private screenerService: ScreenerService) {}

  @Get('run')
  runScreener(@Query('symbols') symbols: string) {
    const symbolArray = symbols ? symbols.split(',') : ['AAPL', 'MAYBANK.KL'];
    return this.screenerService.runDailyScreener(symbolArray);
  }
}
