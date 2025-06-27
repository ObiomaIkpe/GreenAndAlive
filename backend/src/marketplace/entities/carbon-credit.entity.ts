import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Purchase } from './purchase.entity';

@Entity('carbon_credits')
export class CarbonCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // forest, renewable, efficiency, capture

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column()
  location: string;

  @Column({ default: true })
  verified: boolean;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  vintage: number;

  @Column()
  seller: string;

  @Column()
  certification: string;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ default: false })
  blockchainVerified: boolean;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 4.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Purchase, purchase => purchase.carbonCredit)
  purchases: Purchase[];
}