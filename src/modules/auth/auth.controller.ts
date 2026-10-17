import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyResetPasswordDto,
  ResetPasswordDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RoleGuard } from './guards/role.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User Registration
   * POST /auth/register
   * Handled by AuthService.create per architectural specifications
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.create(registerDto);
  }

  /**
   * User Login: issues JWT token and tracks device session
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Allow device ID to be provided in header if not in body
    if (!loginDto.deviceId && req.headers['x-device-id']) {
      loginDto.deviceId = req.headers['x-device-id'] as string;
    }

    return this.authService.login(loginDto, ip, userAgent);
  }

  /**
   * User Logout: revokes the active device session
   * POST /auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any, @Req() req: Request) {
    const deviceId =
      user.deviceId ||
      (req.headers['x-device-id'] as string) ||
      req.body?.deviceId;
    return this.authService.logout(user.sub || user.id, deviceId);
  }

  /**
   * Get device sessions for current user
   * GET /auth/device-sessions
   */
  @Get('device-sessions')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getDeviceSessions(@CurrentUser() user: any) {
    return this.authService.getDeviceSessions(user.sub || user.id);
  }

  /**
   * Revoke a specific device session
   * DELETE /auth/device-sessions/:deviceId
   */
  @Delete('device-sessions/:deviceId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.OK)
  async revokeDeviceSession(
    @CurrentUser() user: any,
    @Param('deviceId') deviceId: string,
  ) {
    return this.authService.revokeDeviceSession(user.sub || user.id, deviceId);
  }

  /**
   * Request password reset token
   * POST /auth/forgot-password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Verify password reset token
   * POST /auth/verify-reset-password
   */
  @Post('verify-reset-password')
  @HttpCode(HttpStatus.OK)
  async verifyResetPassword(@Body() dto: VerifyResetPasswordDto) {
    return this.authService.verifyResetPassword(dto);
  }

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * Request 6-digit numeric OTP
   * POST /auth/request-otp
   */
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  /**
   * Verify 6-digit numeric OTP
   * POST /auth/verify-otp
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
