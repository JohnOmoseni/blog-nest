import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument, DeviceSession } from './schemas/profile.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  /**
   * Find profile by email, explicitly including password and security credentials
   * that are marked with select: false in the schema.
   */
  async findByEmailWithPassword(email: string): Promise<ProfileDocument | null> {
    return this.profileModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password +resetPasswordToken +resetPasswordExpires +otpCode +otpExpires')
      .exec();
  }

  /**
   * Find profile by email (standard sanitized query, password omitted)
   */
  async findByEmail(email: string): Promise<ProfileDocument | null> {
    return this.profileModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
  }

  /**
   * Find profile by ID (standard sanitized query)
   */
  async findById(id: string): Promise<ProfileDocument | null> {
    return this.profileModel.findById(id).exec();
  }

  /**
   * Helper method called by AuthService to persist new profile record
   */
  async saveNewProfile(profileData: Partial<Profile>): Promise<ProfileDocument> {
    const newProfile = new this.profileModel(profileData);
    return newProfile.save();
  }

  /**
   * Update profile password and persist
   */
  async updatePassword(id: string, newHashedPassword: string): Promise<ProfileDocument | null> {
    return this.profileModel
      .findByIdAndUpdate(
        id,
        {
          $set: { password: newHashedPassword },
          $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Set reset password token and expiry
   */
  async setResetPasswordToken(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.profileModel
      .findByIdAndUpdate(id, {
        $set: {
          resetPasswordToken: token,
          resetPasswordExpires: expires,
        },
      })
      .exec();
  }

  /**
   * Clear reset password token and expiry
   */
  async clearResetPasswordToken(id: string): Promise<void> {
    await this.profileModel
      .findByIdAndUpdate(id, {
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1,
        },
      })
      .exec();
  }

  /**
   * Set numeric OTP and expiration
   */
  async setOtp(id: string, otpCode: string, expires: Date): Promise<void> {
    await this.profileModel
      .findByIdAndUpdate(id, {
        $set: {
          otpCode,
          otpExpires: expires,
        },
      })
      .exec();
  }

  /**
   * Clear OTP code and expiration
   */
  async clearOtp(id: string): Promise<void> {
    await this.profileModel
      .findByIdAndUpdate(id, {
        $unset: {
          otpCode: 1,
          otpExpires: 1,
        },
      })
      .exec();
  }

  /**
   * Add or update an active device session
   */
  async addOrUpdateDeviceSession(
    userId: string,
    session: DeviceSession,
  ): Promise<void> {
    const profile = await this.profileModel.findById(userId).exec();
    if (!profile) return;

    const existingIndex = profile.deviceSessions.findIndex(
      (s) => s.deviceId === session.deviceId,
    );

    if (existingIndex > -1) {
      // Update existing session
      profile.deviceSessions[existingIndex].lastActive = new Date();
      profile.deviceSessions[existingIndex].ip = session.ip;
      profile.deviceSessions[existingIndex].userAgent = session.userAgent;
      profile.deviceSessions[existingIndex].isRevoked = false;
    } else {
      // Append new session (limit history to last 15 sessions)
      profile.deviceSessions.push(session);
      if (profile.deviceSessions.length > 15) {
        profile.deviceSessions.shift();
      }
    }

    await profile.save();
  }

  /**
   * Revoke an active device session (used during logout or device management)
   */
  async revokeDeviceSession(userId: string, deviceId: string): Promise<boolean> {
    const result = await this.profileModel.updateOne(
      { _id: userId, 'deviceSessions.deviceId': deviceId },
      { $set: { 'deviceSessions.$.isRevoked': true } },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Retrieve all device sessions for user
   */
  async getDeviceSessions(userId: string): Promise<DeviceSession[]> {
    const profile = await this.profileModel.findById(userId).exec();
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile.deviceSessions || [];
  }

  /**
   * Update profile information
   */
  async update(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDocument> {
    const updated = await this.profileModel
      .findByIdAndUpdate(id, { $set: updateProfileDto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Profile not found');
    }
    return updated;
  }

  /**
   * Retrieve all profiles (admin only)
   */
  async findAll(): Promise<ProfileDocument[]> {
    return this.profileModel.find().exec();
  }
}
