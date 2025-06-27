import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CarbonFootprint } from '../carbon/entities/carbon-footprint.entity';
import { Purchase } from '../marketplace/entities/purchase.entity';
import { WasteDisposal } from '../waste/entities/waste-disposal.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CarbonFootprint)
    private carbonFootprintRepository: Repository<CarbonFootprint>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(WasteDisposal)
    private wasteDisposalRepository: Repository<WasteDisposal>,
  ) {}

  async getUserAnalytics(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const startDate = this.getStartDate(timeframe);

    const [
      carbonTrend,
      purchaseStats,
      wasteStats,
      emissionBreakdown
    ] = await Promise.all([
      this.getCarbonTrend(userId, startDate),
      this.getPurchaseStats(userId, startDate),
      this.getWasteStats(userId, startDate),
      this.getEmissionBreakdown(userId, startDate),
    ]);

    return {
      timeframe,
      carbonTrend,
      purchaseStats,
      wasteStats,
      emissionBreakdown,
    };
  }

  async getPlatformAnalytics() {
    const [
      userStats,
      carbonStats,
      marketplaceStats,
      wasteStats
    ] = await Promise.all([
      this.getUserStats(),
      this.getCarbonStats(),
      this.getMarketplaceStats(),
      this.getWasteStatsGlobal(),
    ]);

    return {
      userStats,
      carbonStats,
      marketplaceStats,
      wasteStats,
    };
  }

  private async getCarbonTrend(userId: string, startDate: Date) {
    return this.carbonFootprintRepository
      .createQueryBuilder('cf')
      .select([
        'DATE(cf.calculationDate) as date',
        'cf.totalEmissions as emissions',
        'cf.electricity',
        'cf.transportation',
        'cf.heating',
        'cf.airTravel',
      ])
      .where('cf.userId = :userId', { userId })
      .andWhere('cf.calculationDate >= :startDate', { startDate })
      .orderBy('cf.calculationDate', 'ASC')
      .getRawMany();
  }

  private async getPurchaseStats(userId: string, startDate: Date) {
    const stats = await this.purchaseRepository
      .createQueryBuilder('p')
      .select([
        'COUNT(*) as totalPurchases',
        'SUM(p.quantity) as totalCredits',
        'SUM(p.totalPrice) as totalSpent',
        'AVG(p.unitPrice) as avgPrice',
      ])
      .where('p.userId = :userId', { userId })
      .andWhere('p.createdAt >= :startDate', { startDate })
      .getRawOne();

    return {
      totalPurchases: parseInt(stats.totalPurchases) || 0,
      totalCredits: parseFloat(stats.totalCredits) || 0,
      totalSpent: parseFloat(stats.totalSpent) || 0,
      avgPrice: parseFloat(stats.avgPrice) || 0,
    };
  }

  private async getWasteStats(userId: string, startDate: Date) {
    const stats = await this.wasteDisposalRepository
      .createQueryBuilder('wd')
      .select([
        'COUNT(*) as totalReports',
        'SUM(wd.amount) as totalAmount',
        'SUM(wd.rewardAmount) as totalRewards',
        'wd.wasteType',
      ])
      .where('wd.userId = :userId', { userId })
      .andWhere('wd.createdAt >= :startDate', { startDate })
      .groupBy('wd.wasteType')
      .getRawMany();

    return stats.map(stat => ({
      wasteType: stat.wasteType,
      totalReports: parseInt(stat.totalReports) || 0,
      totalAmount: parseFloat(stat.totalAmount) || 0,
      totalRewards: parseFloat(stat.totalRewards) || 0,
    }));
  }

  private async getEmissionBreakdown(userId: string, startDate: Date) {
    const latest = await this.carbonFootprintRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!latest) {
      return null;
    }

    const total = parseFloat(latest.totalEmissions.toString());
    return {
      electricity: {
        value: parseFloat(latest.electricity.toString()),
        percentage: (parseFloat(latest.electricity.toString()) / total) * 100,
      },
      transportation: {
        value: parseFloat(latest.transportation.toString()),
        percentage: (parseFloat(latest.transportation.toString()) / total) * 100,
      },
      heating: {
        value: parseFloat(latest.heating.toString()),
        percentage: (parseFloat(latest.heating.toString()) / total) * 100,
      },
      airTravel: {
        value: parseFloat(latest.airTravel.toString()),
        percentage: (parseFloat(latest.airTravel.toString()) / total) * 100,
      },
    };
  }

  private async getUserStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository
      .createQueryBuilder('u')
      .where('u.updatedAt >= :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .getCount();

    return { totalUsers, activeUsers };
  }

  private async getCarbonStats() {
    const stats = await this.carbonFootprintRepository
      .createQueryBuilder('cf')
      .select([
        'COUNT(*) as totalCalculations',
        'AVG(cf.totalEmissions) as avgEmissions',
        'SUM(cf.totalEmissions) as totalEmissions',
      ])
      .getRawOne();

    return {
      totalCalculations: parseInt(stats.totalCalculations) || 0,
      avgEmissions: parseFloat(stats.avgEmissions) || 0,
      totalEmissions: parseFloat(stats.totalEmissions) || 0,
    };
  }

  private async getMarketplaceStats() {
    const stats = await this.purchaseRepository
      .createQueryBuilder('p')
      .select([
        'COUNT(*) as totalPurchases',
        'SUM(p.quantity) as totalCredits',
        'SUM(p.totalPrice) as totalVolume',
      ])
      .getRawOne();

    return {
      totalPurchases: parseInt(stats.totalPurchases) || 0,
      totalCredits: parseFloat(stats.totalCredits) || 0,
      totalVolume: parseFloat(stats.totalVolume) || 0,
    };
  }

  private async getWasteStatsGlobal() {
    const stats = await this.wasteDisposalRepository
      .createQueryBuilder('wd')
      .select([
        'COUNT(*) as totalReports',
        'SUM(wd.amount) as totalAmount',
        'SUM(wd.rewardAmount) as totalRewards',
      ])
      .getRawOne();

    return {
      totalReports: parseInt(stats.totalReports) || 0,
      totalAmount: parseFloat(stats.totalAmount) || 0,
      totalRewards: parseFloat(stats.totalRewards) || 0,
    };
  }

  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}