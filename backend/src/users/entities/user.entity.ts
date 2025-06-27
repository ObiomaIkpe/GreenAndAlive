import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { CarbonFootprint } from '../../carbon/entities/carbon-footprint.entity';
import { Purchase } from '../../marketplace/entities/purchase.entity';
import { AiRecommendation } from '../../ai/entities/ai-recommendation.entity';
import { BlockchainTransaction } from '../../blockchain/entities/blockchain-transaction.entity';
import { VerificationRequest } from '../../verification/entities/verification-request.entity';
import { WasteDisposal } from '../../waste/entities/waste-disposal.entity';
import { UserPreferences } from './user-preferences.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  walletAddress: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 'user' })
  role: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCredits: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  monthlyOffset: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 24 })
  reductionGoal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tokenBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stakingRewards: number;

  @Column({ type: 'int', default: 0 })
  reputationScore: number;

  @Column({ type: 'text', array: true, default: [] })
  achievements: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserPreferences, preferences => preferences.user, { cascade: true })
  @JoinColumn()
  preferences: UserPreferences;

  @OneToMany(() => CarbonFootprint, footprint => footprint.user)
  carbonFootprints: CarbonFootprint[];

  @OneToMany(() => Purchase, purchase => purchase.user)
  purchases: Purchase[];

  @OneToMany(() => AiRecommendation, recommendation => recommendation.user)
  aiRecommendations: AiRecommendation[];

  @OneToMany(() => BlockchainTransaction, transaction => transaction.user)
  blockchainTransactions: BlockchainTransaction[];

  @OneToMany(() => VerificationRequest, request => request.requester)
  verificationRequests: VerificationRequest[];

  @OneToMany(() => WasteDisposal, waste => waste.user)
  wasteDisposals: WasteDisposal[];
}