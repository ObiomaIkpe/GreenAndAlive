import { apiService } from './api';
import { notificationService } from './notificationService';

export interface CarbonCreditAPI {
  id: string;
  type: string;
  price: number;
  quantity: number;
  location: string;
  verified: boolean;
  description: string;
  vintage: number;
  seller: string;
  certification: string;
  tokenId?: string;
  contractAddress?: string;
  blockchainVerified?: boolean;
  metadata?: string;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseData {
  carbonCreditId: string;
  quantity: number;
  notes?: string;
}

export interface Purchase {
  id: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  status: string;
  txHash?: string;
  blockNumber?: number;
  notes?: string;
  createdAt: string;
  carbonCredit: CarbonCreditAPI;
}

export interface MarketplaceFilters {
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  verified?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface MarketplaceStats {
  totalCreditsAvailable: number;
  averagePrice: number;
  totalPurchases: number;
  totalVolume: number;
}

class MarketplaceService {
  async getCredits(filters?: MarketplaceFilters): Promise<CarbonCreditAPI[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const url = `/marketplace/credits${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiService.get<CarbonCreditAPI[]>(url);
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon credits');
      throw error;
    }
  }

  async getCreditById(id: string): Promise<CarbonCreditAPI> {
    try {
      return await apiService.get<CarbonCreditAPI>(`/marketplace/credits/${id}`);
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon credit details');
      throw error;
    }
  }

  async purchaseCredit(data: PurchaseData): Promise<Purchase> {
    try {
      const purchase = await apiService.post<Purchase>('/marketplace/purchase', data);
      
      notificationService.success(
        'Purchase Successful!',
        `Successfully purchased ${purchase.quantity} carbon credits for $${purchase.totalPrice.toFixed(2)}`
      );
      
      return purchase;
    } catch (error) {
      notificationService.error('Purchase Failed', 'Failed to complete purchase');
      throw error;
    }
  }

  async getPurchaseHistory(): Promise<Purchase[]> {
    try {
      return await apiService.get<Purchase[]>('/marketplace/purchases');
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load purchase history');
      throw error;
    }
  }

  async getPurchaseById(id: string): Promise<Purchase> {
    try {
      return await apiService.get<Purchase>(`/marketplace/purchases/${id}`);
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load purchase details');
      throw error;
    }
  }

  async getMarketStats(): Promise<MarketplaceStats> {
    try {
      return await apiService.get<MarketplaceStats>('/marketplace/stats');
    } catch (error) {
      console.warn('Failed to load marketplace stats');
      return {
        totalCreditsAvailable: 0,
        averagePrice: 0,
        totalPurchases: 0,
        totalVolume: 0,
      };
    }
  }

  async createCarbonCredit(data: Partial<CarbonCreditAPI>): Promise<CarbonCreditAPI> {
    try {
      const credit = await apiService.post<CarbonCreditAPI>('/marketplace/credits', data);
      
      notificationService.success('Credit Listed', 'Carbon credit has been listed successfully');
      
      return credit;
    } catch (error) {
      notificationService.error('Listing Failed', 'Failed to list carbon credit');
      throw error;
    }
  }

  async updateCarbonCredit(id: string, data: Partial<CarbonCreditAPI>): Promise<CarbonCreditAPI> {
    try {
      const credit = await apiService.patch<CarbonCreditAPI>(`/marketplace/credits/${id}`, data);
      
      notificationService.success('Credit Updated', 'Carbon credit has been updated');
      
      return credit;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update carbon credit');
      throw error;
    }
  }
}

export const marketplaceService = new MarketplaceService();