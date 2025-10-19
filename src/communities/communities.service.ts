import { Injectable, NotFoundException, BadRequestException,ConflictException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateCommunityDto } from './dto/create-community.dto';

@Injectable()
export class CommunitiesService {
  // --- CONFIG FLAGS
  private readonly usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://localhost:3001';
  private readonly skipUserCheck = process.env.SKIP_USER_CHECK === 'true';
  private readonly useMemory = process.env.MEM_DB === 'true'; // <-- controla modo mock

  // --- In-memory stores (solo si useMemory === true)
  private memCommunities: Community[] = [];
  private memMembers: CommunityMember[] = [];
  private memIdCounter = 1;

  constructor(
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,

    @InjectRepository(CommunityMember)
    private readonly memberRepo: Repository<CommunityMember>,

    private readonly httpService: HttpService,
  ) {}

  // -------------------------
  // CREATE COMMUNITY
  // -------------------------
  async createCommunity(createDto: CreateCommunityDto): Promise<Community> {
    if (this.useMemory) {
      // memory-mode: validate uniqueness and create
      const exists = this.memCommunities.find(c => c.name === createDto.name);
      if (exists) throw new BadRequestException('Community name already exists');

      const existsid = this.memCommunities.find(c => c.id === createDto.id);
      if (existsid) throw new BadRequestException('Community id already exists');

      const c: Community = {
        id: createDto.id,
        name: createDto.name,
        description: createDto.description ?? null,
        members: [],
      } as Community;

      this.memCommunities.push(c);
      return c;
    }

    // normal DB mode (sin cambios)
    const exists = await this.communityRepo.findOne({ where: { name: createDto.name } });
    if (exists) throw new BadRequestException('Community name already exists');
    const community = this.communityRepo.create(createDto);
    return this.communityRepo.save(community);
  }

  // -------------------------
  // FIND ALL
  // -------------------------
  async findAll(): Promise<Community[]> {
    if (this.useMemory) {
      // devolver comunidades con miembros incluidos
      return this.memCommunities.map(c => ({
        ...c,
        members: this.memMembers.filter(m => (m.community && (m.community as Community).id) === c.id),
      } as Community));
    }
    return this.communityRepo.find({ relations: ['members'] });
  }

  // -------------------------
  // VALIDAR USUARIO (posible skip)
  // -------------------------
  private async validateUserExists(userId: string) {
    // en modo memoria o si el flag SKIP_USER_CHECK es true, devolvemos mock
    if (this.skipUserCheck || this.useMemory) {
      return { id: userId, username: 'mock-user' };
    }

    try {
      const resp = await firstValueFrom(
        this.httpService.get(`${this.usersServiceUrl}/users/${userId}`)
      );
      return resp.data;
    } catch (err) {
      throw new NotFoundException('User not found in Users Service');
    }
  }

  // -------------------------
  // JOIN COMMUNITY
  // -------------------------
  async joinCommunity(communityId: number, userId: string): Promise<CommunityMember> {
    if (!Number.isInteger(communityId)) throw new BadRequestException('communityId must be an integer');

    if (this.useMemory) {
      const community = this.memCommunities.find(c => c.id === communityId);
      if (!community) throw new NotFoundException('Community not found');

      // validar usuario (skippable)
      await this.validateUserExists(userId);

      const existing = this.memMembers.find(m => m.community.id === communityId && m.userId === userId);
      if (existing) return existing;

      const mem: CommunityMember = {
        id: userId,
        userId,
        community,
        role: 'member',
      } as CommunityMember;

      this.memMembers.push(mem);
      return mem;
    }

    // DB-mode
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    await this.validateUserExists(userId);

    const existing = await this.memberRepo
      .createQueryBuilder('m')
      .innerJoin('m.community', 'c')
      .where('m.userId = :userId', { userId })
      .andWhere('c.id = :cid', { cid: communityId })
      .getOne();

    if (existing) return existing;

    const membership = this.memberRepo.create({ userId, community, role: 'member' });
    return this.memberRepo.save(membership);
  }

  // -------------------------
  // LEAVE COMMUNITY
  // -------------------------
  async leaveCommunity(communityId: number, userId: string): Promise<{ success: boolean }> {
    if (!Number.isInteger(communityId)) throw new BadRequestException('communityId must be an integer');

    if (this.useMemory) {
      const index = this.memMembers.findIndex(m => m.community.id === communityId && m.userId === userId);
      if (index === -1) throw new NotFoundException('Membership not found');
      this.memMembers.splice(index, 1);
      return { success: true };
    }

    const membership = await this.memberRepo
      .createQueryBuilder('m')
      .innerJoin('m.community', 'c')
      .where('m.userId = :userId', { userId })
      .andWhere('c.id = :cid', { cid: communityId })
      .getOne();

    if (!membership) throw new NotFoundException('Membership not found');

    await this.memberRepo.remove(membership);
    return { success: true };
  }

  // -------------------------
  // LIST MEMBERS
  // -------------------------
  async listMembers(communityId: number): Promise<CommunityMember[]> {
    if (!Number.isInteger(communityId)) throw new BadRequestException('communityId must be an integer');

    if (this.useMemory) {
      return this.memMembers.filter(m => m.community.id === communityId);
    }

    return this.memberRepo
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.community', 'c')
      .where('c.id = :cid', { cid: communityId })
      .getMany();
  }

  async findOne(id: number): Promise<Community> {
    const community = await this.communityRepo.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!community) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }

    return community;
  }
}
