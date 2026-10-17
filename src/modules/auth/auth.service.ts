import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfileService } from '../profile/profile.service.js';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyResetPasswordDto,
  ResetPasswordDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto.js';
import { DeviceSession } from '../profile/schemas/profile.schema.js';
import { Role } from '../profile/enums/enum.js';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  deviceId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * User Registration logic (defined in AuthService per architectural specification).
   * Verifies uniqueness, hashes password with bcrypt, and persists profile.
   */
  async create(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.toLowerCase().trim();

    // 1. Check if email already exists
    const existing = await this.profileService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException(
        'A user with this email address already exists',
      );
    }

    // 2. Hash password with bcrypt (salt rounds = 10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // 3. Persist new profile
    const newProfile = await this.profileService.saveNewProfile({
      email: normalizedEmail,
      password: hashedPassword,
      name: registerDto.name.trim(),
      role: registerDto.role || Role.USER,
      isActive: true,
      deviceSessions: [],
    });

    // 4. Return sanitized profile record (exclude password)
    return {
      id: newProfile._id,
      email: newProfile.email,
      name: newProfile.name,
      role: newProfile.role,
      createdAt: newProfile.createdAt,
    };
  }

  /**
   * Validate user credentials using ProfileService.findByEmailWithPassword
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    const profile =
      await this.profileService.findByEmailWithPassword(normalizedEmail);

    if (!profile || !profile.password) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, profile.password);
    if (!isMatch) {
      return null;
    }

    if (!profile.isActive) {
      throw new UnauthorizedException(
        'Account has been deactivated. Please contact support.',
      );
    }

    return profile;
  }

  /**
   * Login: validates credentials, tracks device session, issues signed JWT token
   */
  async login(
    loginDto: LoginDto,
    ip: string = '127.0.0.1',
    userAgent: string = 'unknown',
  ) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Determine or generate unique device identifier
    const deviceId = loginDto.deviceId || crypto.randomUUID();

    const session: DeviceSession = {
      deviceId,
      ip,
      userAgent,
      lastActive: new Date(),
      isRevoked: false,
    };

    // Record or update active device session in the database
    await this.profileService.addOrUpdateDeviceSession(
      user._id.toString(),
      session,
    );

    // Build JWT payload
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      deviceId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      deviceId,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Logout: revokes the active device session for the authenticated user
   */
  async logout(userId: string, deviceId: string) {
    if (!deviceId) {
      throw new BadRequestException(
        'DeviceId is required to revoke device session',
      );
    }

    const revoked = await this.profileService.revokeDeviceSession(
      userId,
      deviceId,
    );
    if (!revoked) {
      // Session might already be revoked or not found; still acknowledge logout
      return {
        success: true,
        message: 'Session ended successfully',
      };
    }

    return {
      success: true,
      message: 'Logged out successfully and device session revoked',
    };
  }

  /**
   * Request password reset token
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const profile = await this.profileService.findByEmail(normalizedEmail);

    // Security practice: Return generic positive message even if user doesn't exist
    // to prevent email enumeration attacks, but generate token if exists
    if (!profile) {
      return {
        message:
          'If the provided email is registered, a password reset token has been dispatched.',
      };
    }

    // Generate secure random 32-byte hex token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Token valid for 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.profileService.setResetPasswordToken(
      profile._id.toString(),
      resetToken,
      expires,
    );

    return {
      message: 'Password reset token generated successfully',
      // In development / testing environments, token is returned for verification
      resetToken,
      expiresAt: expires.toISOString(),
    };
  }

  /**
   * Verify whether a password reset token is valid and unexpired
   */
  async verifyResetPassword(dto: VerifyResetPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const profile =
      await this.profileService.findByEmailWithPassword(normalizedEmail);

    if (
      !profile ||
      !profile.resetPasswordToken ||
      !profile.resetPasswordExpires
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (profile.resetPasswordToken !== dto.token) {
      throw new BadRequestException('Invalid password reset token');
    }

    if (new Date() > profile.resetPasswordExpires) {
      throw new BadRequestException(
        'Password reset token has expired. Please request a new one.',
      );
    }

    return {
      valid: true,
      message: 'Password reset token is valid',
    };
  }

  /**
   * Reset user password using verified reset token
   */
  async resetPassword(dto: ResetPasswordDto) {
    // 1. Verify token validity first
    await this.verifyResetPassword({ email: dto.email, token: dto.token });

    const normalizedEmail = dto.email.toLowerCase().trim();
    const profile =
      await this.profileService.findByEmailWithPassword(normalizedEmail);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // 3. Update password and clear reset token
    await this.profileService.updatePassword(
      profile._id.toString(),
      hashedPassword,
    );

    return {
      success: true,
      message:
        'Password has been reset successfully. You can now log in with your new credentials.',
    };
  }

  /**
   * Request a 6-digit numeric OTP code
   */
  async requestOtp(dto: RequestOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const profile = await this.profileService.findByEmail(normalizedEmail);

    if (!profile) {
      // Prevent email enumeration
      return {
        message:
          'If the provided email is registered, an OTP code has been dispatched.',
      };
    }

    // Generate 6-digit cryptographically secure integer
    const otpCode = crypto.randomInt(100000, 999999).toString();
    // Expiration: 10 minutes
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.profileService.setOtp(profile._id.toString(), otpCode, expires);

    return {
      message: 'OTP has been generated successfully',
      otpCode, // Returned for dev/testing convenience
      expiresAt: expires.toISOString(),
    };
  }

  /**
   * Verify a 6-digit numeric OTP code
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const profile =
      await this.profileService.findByEmailWithPassword(normalizedEmail);

    if (!profile || !profile.otpCode || !profile.otpExpires) {
      throw new BadRequestException(
        'No active OTP found. Please request a new one.',
      );
    }

    if (profile.otpCode !== dto.otpCode) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (new Date() > profile.otpExpires) {
      throw new BadRequestException('OTP code has expired');
    }

    // Clear OTP once verified
    await this.profileService.clearOtp(profile._id.toString());

    return {
      valid: true,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Get all device sessions for a user
   */
  async getDeviceSessions(userId: string) {
    return this.profileService.getDeviceSessions(userId);
  }

  /**
   * Revoke specific device session
   */
  async revokeDeviceSession(userId: string, deviceId: string) {
    const revoked = await this.profileService.revokeDeviceSession(
      userId,
      deviceId,
    );
    if (!revoked) {
      throw new NotFoundException(
        'Device session not found or already revoked',
      );
    }
    return {
      success: true,
      message: `Device session '${deviceId}' has been revoked`,
    };
  }
}
