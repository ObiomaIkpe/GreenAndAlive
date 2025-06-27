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

@Entity('verification_requests')
export class VerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // waste_disposal, carbon_offset, corporate_emissions, renewable_energy

  @Column()
  dataHash: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  bounty: number;

  @Column({ default: 'open' })
  status: string; // open, in_progress, completed, disputed

  @Column({ nullable: true })
  assignedVerifier: string;

  @Column({ type: 'int', nullable: true })
  confidence: number;

  @Column({ type: 'text', nullable: true })
  report: string;

  @Column({ type: 'date' })
  deadline: Date;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.verificationRequests)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column()
  requesterId: string;
}