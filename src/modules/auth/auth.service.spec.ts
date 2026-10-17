import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '../profile/enums/enum.js';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockProfileService: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockProfileService = {
      findByEmail: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      findById: vi.fn(),
      saveNewProfile: vi.fn(),
      updatePassword: vi.fn(),
      setResetPasswordToken: vi.fn(),
      clearResetPasswordToken: vi.fn(),
      setOtp: vi.fn(),
      clearOtp: vi.fn(),
      addOrUpdateDeviceSession: vi.fn(),
      revokeDeviceSession: vi.fn(),
      getDeviceSessions: vi.fn(),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock-jwt-token'),
    };

    authService = new AuthService(mockProfileService, mockJwtService);
  });

  describe('create (User Registration)', () => {
    it('should register a new user with hashed password', async () => {
      mockProfileService.findByEmail.mockResolvedValue(null);
      mockProfileService.saveNewProfile.mockImplementation((data: any) => ({
        _id: 'user-id-123',
        ...data,
        createdAt: new Date(),
      }));

      const result = await authService.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockProfileService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockProfileService.saveNewProfile).toHaveBeenCalled();
      expect(result.email).toBe('test@example.com');
      expect(result.id).toBe('user-id-123');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already registered', async () => {
      mockProfileService.findByEmail.mockResolvedValue({
        email: 'test@example.com',
      });

      await expect(
        authService.create({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login & JWT issuance', () => {
    it('should return accessToken and record device session for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('secretPass', 10);
      mockProfileService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: Role.USER,
        isActive: true,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'secretPass',
        deviceId: 'device-abc',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.deviceId).toBe('device-abc');
      expect(result.user.email).toBe('test@example.com');
      expect(mockProfileService.addOrUpdateDeviceSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('secretPass', 10);
      mockProfileService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke device session on logout', async () => {
      mockProfileService.revokeDeviceSession.mockResolvedValue(true);

      const result = await authService.logout('user-id-123', 'device-abc');
      expect(result.success).toBe(true);
      expect(mockProfileService.revokeDeviceSession).toHaveBeenCalledWith(
        'user-id-123',
        'device-abc',
      );
    });
  });

  describe('forgotPassword, verifyResetPassword, resetPassword', () => {
    it('should generate password reset token', async () => {
      mockProfileService.findByEmail.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
      });

      const result = await authService.forgotPassword({
        email: 'test@example.com',
      });
      expect(result.resetToken).toBeDefined();
      expect(mockProfileService.setResetPasswordToken).toHaveBeenCalled();
    });

    it('should verify valid reset token', async () => {
      mockProfileService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 100000),
      });

      const result = await authService.verifyResetPassword({
        email: 'test@example.com',
        token: 'valid-token',
      });

      expect(result.valid).toBe(true);
    });

    it('should reject expired reset token', async () => {
      mockProfileService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() - 100000), // expired
      });

      await expect(
        authService.verifyResetPassword({
          email: 'test@example.com',
          token: 'valid-token',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password with valid token', async () => {
      mockProfileService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 100000),
      });

      const result = await authService.resetPassword({
        email: 'test@example.com',
        token: 'valid-token',
        newPassword: 'newPassword123',
      });

      expect(result.success).toBe(true);
      expect(mockProfileService.updatePassword).toHaveBeenCalled();
    });
  });

  describe('requestOtp & verifyOtp', () => {
    it('should generate numeric OTP', async () => {
      mockProfileService.findByEmail.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
      });

      const result = await authService.requestOtp({
        email: 'test@example.com',
      });
      expect(result.otpCode).toHaveLength(6);
      expect(mockProfileService.setOtp).toHaveBeenCalled();
    });

    it('should verify correct OTP code', async () => {
      mockProfileService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        otpCode: '123456',
        otpExpires: new Date(Date.now() + 60000),
      });

      const result = await authService.verifyOtp({
        email: 'test@example.com',
        otpCode: '123456',
      });

      expect(result.valid).toBe(true);
      expect(mockProfileService.clearOtp).toHaveBeenCalledWith('user-id-123');
    });

    it('should reject wrong OTP code', async () => {
      mockProfileService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        otpCode: '123456',
        otpExpires: new Date(Date.now() + 60000),
      });

      await expect(
        authService.verifyOtp({
          email: 'test@example.com',
          otpCode: '999999',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
