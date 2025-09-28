import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Community } from './community.entity';

@Entity()
export class CommunityMember {
  @PrimaryColumn()
  id: string;

  // guardamos sólo el userId (string/uuid) que referencia al users-service
  @Column()
  userId: string;

  @ManyToOne(() => Community, (c) => c.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @Column({ default: 'member' })
  role: string;
}
