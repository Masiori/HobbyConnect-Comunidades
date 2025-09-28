import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Community, CommunityMember]),
    HttpModule, // para HttpService
  ],
  providers: [CommunitiesService],
  controllers: [CommunitiesController],
})
export class CommunitiesModule {}
