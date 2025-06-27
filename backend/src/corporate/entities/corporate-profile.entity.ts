import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('corporate_profiles')
export class CorporateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  industry: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  expectedEmissions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  actualEmissions: number;

  @Column()
  compliancePeriod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditsOwned: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  creditsRequired: number;

  @Column({ type: 'int', default: 50 })
  reputationScore: number;

  @Column({ default: 'pending' })
  verificationStatus: string; // pending, verified, non_compliant

  @Column({ type: 'text', nullable: true })
  verificationData: string;

  @Column({ type: 'text', nullable: true })
  complianceNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}