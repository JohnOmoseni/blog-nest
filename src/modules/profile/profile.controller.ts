import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from './enums/enum.js';

@Controller('profile')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Get currently logged-in user profile
   * GET /profile/me
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser() user: any) {
    const profile = await this.profileService.findById(user.sub || user.id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  /**
   * Update currently logged-in user profile
   * PATCH /profile/me
   */
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.sub || user.id, updateProfileDto);
  }

  /**
   * Admin only route: retrieve all user profiles
   * GET /profile/all
   */
  @Get('all')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAllProfiles() {
    return this.profileService.findAll();
  }

  /**
   * Get profile by ID
   * GET /profile/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProfileById(@Param('id') id: string) {
    const profile = await this.profileService.findById(id);
    if (!profile) {
      throw new NotFoundException(`Profile with ID '${id}' not found`);
    }
    return profile;
  }
}
