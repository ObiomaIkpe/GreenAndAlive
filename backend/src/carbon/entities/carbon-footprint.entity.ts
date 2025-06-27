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

@Entity('carbon_footprints')
export class CarbonFootprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  electricity: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  transportation: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  heating: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  airTravel: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  totalEmissions: number;

  @Column({ type: 'date' })
  calculationDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.carbonFootprints)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}