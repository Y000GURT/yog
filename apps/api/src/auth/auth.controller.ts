import {
  Body,
  Controller,
  Cookies,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'

import type { AuthenticatedRequest } from './auth-request.js'
import { AuthService } from './auth.service.js'
import { LoginDto } from './dto/login.dto.js'
import { RegisterDto } from './dto/register.dto.js'
import { JwtAuthGuard } from './jwt-auth.guard.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const trustedOrigin = process.env.WEB_ORIGIN

    if (!trustedOrigin || origin !== trustedOrigin) {
      throw new ForbiddenException('Недопустимый Origin')
    }

    const result = await this.authService.login(dto)

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      expires: result.refreshExpiresAt,
    })

    response.setHeader('Cache-Control', 'no-store')

    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Cookies('refresh_token') refreshToken: unknown,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const trustedOrigin = process.env.WEB_ORIGIN

    if (!trustedOrigin || origin !== trustedOrigin) {
      throw new ForbiddenException('Недопустимый Origin')
    }

    if (typeof refreshToken !== 'string' || !refreshToken) {
      throw new UnauthorizedException('Отсутствует refresh-токен')
    }

    const result = await this.authService.refresh(refreshToken)

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      expires: result.refreshExpiresAt,
    })

    response.setHeader('Cache-Control', 'no-store')

    return {
      accessToken: result.accessToken,
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Cookies('refresh_token') refreshToken: unknown,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const trustedOrigin = process.env.WEB_ORIGIN

    if (!trustedOrigin || origin !== trustedOrigin) {
      throw new ForbiddenException('Недопустимый Origin')
    }

    if (typeof refreshToken === 'string' && refreshToken) {
      await this.authService.logout(refreshToken)
    }

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    })

    response.setHeader('Cache-Control', 'no-store')
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.user.id)
  }
}
