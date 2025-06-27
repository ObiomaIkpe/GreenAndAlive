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

@Entity('ai_recommendations')
export class AiRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // reduction, purchase, optimization, behavioral

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  impact: number;

  @Column({ type: 'int' })
  confidence: number;

  @Column()
  category: string;

  @Column({ type: 'int', nullable: true })
  rewardPotential: number;

  @Column({ type: 'text', array: true, default: [] })
  actionSteps: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ default: '1-3 months' })
  timeframe: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ default: false })
  implemented: boolean;

  @Column({ default: false })
  dismissed: boolean;

  @Column({ type: 'text', nullable: true })
  implementationNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.aiRecommendations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}