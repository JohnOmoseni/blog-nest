import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from '../posts/posts.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import Joi from 'joi';
import appConfig from '../../config/app.config.js';
import jwtConfig from '../../config/jwt.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
      validationSchema: Joi.object({
        PORT: Joi.number().port(),
        NODE_ENV: Joi.string().valid('development', 'production', 'test'),
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string(),
      }),
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    AuthModule,
    ProfileModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
