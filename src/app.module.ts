// src/app.module.ts (communities-service)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { CommunitiesModule } from './communities/communities.module';
import { Community } from './communities/entities/community.entity';
import { CommunityMember } from './communities/entities/community-member.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const useMem = cfg.get<string>('MEM_DB') === 'true';
        if (useMem) {
          // Modo “sin BD”: SQLite en memoria, efímera (se borra al reiniciar)
          return {
            type: 'sqlite',
            database: ':memory:',
            entities: [Community, CommunityMember],
            synchronize: true,
            dropSchema: true,   // limpia esquema cada arranque (ideal para pruebas)
            logging: false,
          };
        }
        // Tu config normal (si luego quieres volver a Postgres/Supabase)
        const url = cfg.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url,
          autoLoadEntities: true,
          synchronize: cfg.get<string>('TYPEORM_SYNC') === 'true',
          logging: cfg.get<string>('TYPEORM_LOGGING') === 'true',
          extra: {
            ssl: cfg.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined,
          },
        };
      },
    }),

    HttpModule,          // lo dejamos; abajo haremos “skip” del check de usuario en pruebas
    CommunitiesModule,
  ],
})
export class AppModule {}
