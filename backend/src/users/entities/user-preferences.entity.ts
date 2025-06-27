import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'San Francisco, CA' })
  location: string;

  @Column({ type: 'text', array: true, default: ['urban', 'tech_worker'] })
  lifestyle: string[];

  @Column({ type: 'int', default: 500 })
  budget: number;

  @Column({ default: true })
  notifications: boolean;

  @Column({ default: 'light' })
  theme: string;

  @Column({ type: 'text', array: true, default: ['renewable_energy', 'forest_conservation'] })
  preferences: string[];

  @Column({ default: 'medium' })
  riskTolerance: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, user => user.preferences)
  user: User;
}