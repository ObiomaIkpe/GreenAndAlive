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

@Entity('waste_disposals')
export class WasteDisposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  wasteType: string; // organic, recyclable, electronic, hazardous, general

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  amount: number;

  @Column()
  method: string; // recycling, composting, proper_disposal, upcycling, donation

  @Column()
  location: string;

  @Column()
  proofHash: string;

  @Column({ default: 'pending' })
  status: string; // pending, verified, rejected

  @Column({ type: 'int', nullable: true })
  rewardAmount: number;

  @Column({ type: 'text', nullable: true })
  verifierNotes: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.wasteDisposals)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}