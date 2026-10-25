import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() req: any) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
      throw new UnauthorizedException('Kredensial tidak sah');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() userData: Prisma.UserCreateInput) {
    return this.authService.register(userData);
  }
}
