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

@Entity('blockchain_transactions')
export class BlockchainTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // mint, stake, claim, offset, purchase

  @Column()
  txHash: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @Column({ nullable: true })
  tokenSymbol: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'pending' })
  status: string; // pending, confirmed, failed

  @Column({ type: 'int', nullable: true })
  blockNumber: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  gasUsed: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  gasPrice: number;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.blockchainTransactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}