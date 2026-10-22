// src/auth/auth.controller.ts
import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDtoSchema } from './dto/login.dto';
import { RegisterDtoSchema } from './dto/register.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private refreshCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/api/auth',
      maxAge: this.authService.refreshCookieMaxAgeMs(),
    };
  }

  private refreshTokenFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;
    const prefix = 'nanapay_refresh=';
    const value = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
    return value ? decodeURIComponent(value.slice(prefix.length)) : null;
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(new ZodValidationPipe(RegisterDtoSchema)) body: any) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema)) body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body, req.ip, req.headers['user-agent']);
    response.cookie('nanapay_refresh', result.refreshToken, this.refreshCookieOptions());
    // Le refresh token ne quitte jamais le canal httpOnly.
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.refreshTokenFromRequest(req);
    if (!refreshToken) {
      response.clearCookie('nanapay_refresh', { path: '/api/auth' });
      return this.authService.refresh('', req.ip, req.headers['user-agent']);
    }
    const result = await this.authService.refresh(refreshToken, req.ip, req.headers['user-agent']);
    response.cookie('nanapay_refresh', result.refreshToken, this.refreshCookieOptions());
    return { accessToken: result.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.refreshTokenFromRequest(req);
    if (refreshToken) await this.authService.logout(refreshToken);
    response.clearCookie('nanapay_refresh', { path: '/api/auth' });
  }

  @Get('me')
  async me(@Req() req: any) {
    return this.authService.me(req.user?.id);
  }
}
