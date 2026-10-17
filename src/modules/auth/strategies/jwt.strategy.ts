import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ProfileService } from '../../profile/profile.service.js';
import { JwtPayload } from '../auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly profileService: ProfileService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET configuration is missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const profile = await this.profileService.findById(payload.sub);

    if (!profile) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (!profile.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    // Verify session state if deviceId is attached to the token
    if (payload.deviceId && profile.deviceSessions) {
      const session = profile.deviceSessions.find(
        (s) => s.deviceId === payload.deviceId,
      );
      if (session && session.isRevoked) {
        throw new UnauthorizedException(
          'Your session has been revoked. Please sign in again.',
        );
      }
    }

    return {
      sub: profile._id.toString(),
      id: profile._id.toString(),
      email: profile.email,
      name: profile.name,
      role: profile.role,
      deviceId: payload.deviceId,
    };
  }
}
