import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../enums/enum.js';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ _id: false })
export class DeviceSession {
  @Prop({ required: true })
  deviceId: string;

  @Prop({ default: 'unknown' })
  ip: string;

  @Prop({ default: 'unknown' })
  userAgent: string;

  @Prop({ default: () => new Date() })
  lastActive: Date;

  @Prop({ default: false })
  isRevoked: boolean;
}

export const DeviceSessionSchema = SchemaFactory.createForClass(DeviceSession);

@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false, select: false })
  resetPasswordToken?: string;

  @Prop({ required: false, select: false })
  resetPasswordExpires?: Date;

  @Prop({ required: false, select: false })
  otpCode?: string;

  @Prop({ required: false, select: false })
  otpExpires?: Date;

  @Prop({ type: [DeviceSessionSchema], default: [] })
  deviceSessions: DeviceSession[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
