import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { JoinCommunityDto } from './dto/join-community.dto';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  create(@Body() createDto: CreateCommunityDto) {
    return this.communitiesService.createCommunity(createDto);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id/members')
  listMembers(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.listMembers(id);
  }

  @Post(':id/join')
  join(
    @Param('id', ParseIntPipe) id: number,
    @Body() joinDto: JoinCommunityDto,
  ) {
    return this.communitiesService.joinCommunity(id, joinDto.id);
  }

  // Usamos POST para leave (evita problemas con body en DELETE)
  @Post(':id/leave')
  leave(
    @Param('id', ParseIntPipe) id: number,
    @Body() joinDto: JoinCommunityDto,
  ) {
    return this.communitiesService.leaveCommunity(id, joinDto.id);
  }
}
