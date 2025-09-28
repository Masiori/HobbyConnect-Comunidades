import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { CommunityMember } from './community-member.entity';

@Entity()
export class Community {
  @PrimaryColumn() // number id
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => CommunityMember, (m) => m.community)
  members: CommunityMember[];
}
