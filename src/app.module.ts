// src/app.module.ts (communities-service)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { CommunitiesModule } from './communities/communities.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    HttpModule,          // lo dejamos; abajo haremos “skip” del check de usuario en pruebas
    CommunitiesModule,
  ],
})
export class AppModule {}
