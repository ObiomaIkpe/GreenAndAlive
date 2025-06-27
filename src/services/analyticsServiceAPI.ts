import { apiService } from './api';
import { notificationService } from './notificationService';

export interface UserAnalytics {
  timeframe: string;
  carbonTrend: {
    date: string;
    emissions: number;
    electricity: number;
    transportation: number;
    heating: number;
    airTravel: number;
  }[];
  purchaseStats: {
    totalPurchases: number;
    totalCredits: number;
    totalSpent: number;
    avgPrice: number;
  };
  wasteStats: {
    wasteType: string;
    totalReports: number;
    totalAmount: number;
    totalRewards: number;
  }[];
  emissionBreakdown: {
    electricity: { value: number; percentage: number };
    transportation: { value: number; percentage: number };
    heating: { value: number; percentage: number };
    airTravel: { value: number; percentage: number };
  } | null;
}

export interface PlatformAnalytics {
  userStats: {
    totalUsers: number;
    activeUsers: number;
  };
  carbonStats: {
    totalCalculations: number;
    avgEmissions: number;
    totalEmissions: number;
  };
  marketplaceStats: {
    totalPurchases: number;
    totalCredits: number;
    totalVolume: number;
  };
  wasteStats: {
    totalReports: number;
    totalAmount: number;
    totalRewards: number;
  };
}

class AnalyticsServiceAPI {
  async getUserAnalytics(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<UserAnalytics> {
    try {
      return await apiService.get<UserAnalytics>(`/analytics/user?timeframe=${timeframe}`);
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load analytics data');
      throw error;
    }
  }

  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      return await apiService.get<PlatformAnalytics>('/analytics/platform');
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load platform analytics');
      throw error;
    }
  }
}

export const analyticsServiceAPI = new AnalyticsServiceAPI();