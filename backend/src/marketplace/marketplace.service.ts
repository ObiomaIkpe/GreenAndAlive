import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarbonCredit } from './entities/carbon-credit.entity';
import { Purchase } from './entities/purchase.entity';
import { User } from '../users/entities/user.entity';
import { CreateCarbonCreditDto } from './dto/create-carbon-credit.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdateCarbonCreditDto } from './dto/update-carbon-credit.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(CarbonCredit)
    private carbonCreditRepository: Repository<CarbonCredit>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createCarbonCredit(createCarbonCreditDto: CreateCarbonCreditDto) {
    const carbonCredit = this.carbonCreditRepository.create(createCarbonCreditDto);
    return this.carbonCreditRepository.save(carbonCredit);
  }

  async findAllCredits(filters?: {
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    verified?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }) {
    const query = this.carbonCreditRepository.createQueryBuilder('credit');

    if (filters?.type) {
      query.andWhere('credit.type = :type', { type: filters.type });
    }

    if (filters?.minPrice) {
      query.andWhere('credit.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters?.maxPrice) {
      query.andWhere('credit.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters?.location) {
      query.andWhere('credit.location ILIKE :location', { location: `%${filters.location}%` });
    }

    if (filters?.verified !== undefined) {
      query.andWhere('credit.verified = :verified', { verified: filters.verified });
    }

    // Sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'DESC';
    query.orderBy(`credit.${sortBy}`, sortOrder);

    // Pagination
    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return query.getMany();
  }

  async findCreditById(id: string) {
    const credit = await this.carbonCreditRepository.findOne({ where: { id } });
    if (!credit) {
      throw new NotFoundException('Carbon credit not found');
    }
    return credit;
  }

  async updateCarbonCredit(id: string, updateCarbonCreditDto: UpdateCarbonCreditDto) {
    const credit = await this.findCreditById(id);
    Object.assign(credit, updateCarbonCreditDto);
    return this.carbonCreditRepository.save(credit);
  }

  async purchaseCredit(userId: string, createPurchaseDto: CreatePurchaseDto) {
    const { carbonCreditId, quantity } = createPurchaseDto;

    // Find the carbon credit
    const carbonCredit = await this.findCreditById(carbonCreditId);

    // Check if enough quantity is available
    if (carbonCredit.quantity < quantity) {
      throw new BadRequestException('Insufficient quantity available');
    }

    // Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate total price
    const unitPrice = carbonCredit.price;
    const totalPrice = unitPrice * quantity;

    // Create purchase record
    const purchase = this.purchaseRepository.create({
      userId,
      carbonCreditId,
      quantity,
      unitPrice,
      totalPrice,
      status: 'completed',
    });

    // Update carbon credit quantity
    carbonCredit.quantity -= quantity;
    await this.carbonCreditRepository.save(carbonCredit);

    // Update user portfolio
    user.totalCredits = Number(user.totalCredits) + quantity;
    user.totalValue = Number(user.totalValue) + totalPrice;
    await this.userRepository.save(user);

    return this.purchaseRepository.save(purchase);
  }

  async getUserPurchases(userId: string) {
    return this.purchaseRepository.find({
      where: { userId },
      relations: ['carbonCredit'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPurchaseById(id: string, userId: string) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id, userId },
      relations: ['carbonCredit'],
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  async getMarketStats() {
    const totalCredits = await this.carbonCreditRepository
      .createQueryBuilder('credit')
      .select('SUM(credit.quantity)', 'total')
      .getRawOne();

    const avgPrice = await this.carbonCreditRepository
      .createQueryBuilder('credit')
      .select('AVG(credit.price)', 'average')
      .getRawOne();

    const totalPurchases = await this.purchaseRepository.count();

    const totalVolume = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.totalPrice)', 'volume')
      .getRawOne();

    return {
      totalCreditsAvailable: parseInt(totalCredits.total) || 0,
      averagePrice: parseFloat(avgPrice.average) || 0,
      totalPurchases,
      totalVolume: parseFloat(totalVolume.volume) || 0,
    };
  }
}