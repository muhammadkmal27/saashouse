import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { AuthGuard } from '@nestjs/passport';
import { Prisma } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('api/strategies')
export class StrategiesController {
  constructor(private strategiesService: StrategiesService) {}

  @Post()
  create(@Request() req: any, @Body() body: Omit<Prisma.StrategyCreateInput, 'user'>) {
    return this.strategiesService.create(req.user.userId, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.strategiesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.strategiesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: Prisma.StrategyUpdateInput) {
    return this.strategiesService.update(req.user.userId, id, body);
  }

  @Patch(':id/toggle')
  toggle(@Request() req: any, @Param('id') id: string) {
    return this.strategiesService.toggleStatus(req.user.userId, id);
  }
}
