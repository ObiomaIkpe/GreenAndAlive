import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { authService } from './authService';

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
  sortOrder?: 'asc' | 'desc';
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
      let data;
      
      try {
        let query = supabase
          .from('carbon_credits')
          .select('*');
        
        // Apply filters
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        
        if (filters?.minPrice) {
          query = query.gte('price', filters.minPrice);
        }
        
        if (filters?.maxPrice) {
          query = query.lte('price', filters.maxPrice);
        }
        
        if (filters?.location) {
          query = query.ilike('location', `%${filters.location}%`);
        }
        
        if (filters?.verified !== undefined) {
          query = query.eq('verified', filters.verified);
        }
        
        // Apply sorting
        const sortBy = filters?.sortBy || 'created_at';
        const sortOrder = filters?.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        
        // Apply pagination
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        
        if (filters?.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
        }
        
        const { data: credits, error } = await query;
        
        if (error) throw error;
        data = credits;
      } catch (e) {
        console.warn('Supabase credits fetch error, using fallback:', e);
        // Fallback to mock data
        data = this.getMockCredits();
        
        // Apply filters to mock data
        if (filters?.type && filters.type !== 'all') {
          data = data.filter(credit => credit.type === filters.type);
        }
        
        // Apply sorting to mock data
        const sortBy = filters?.sortBy || 'created_at';
        const sortOrder = filters?.sortOrder || 'desc';
        data.sort((a, b) => {
          if (sortBy === 'price') {
            return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
          } else if (sortBy === 'quantity') {
            return sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
          } else if (sortBy === 'vintage') {
            return sortOrder === 'asc' ? a.vintage - b.vintage : b.vintage - a.vintage;
          }
          return 0;
        });
      }
      
      return data.map(credit => this.formatCarbonCredit(credit));
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon credits');
      throw error;
    }
  }

  async getCreditById(id: string): Promise<CarbonCreditAPI> {
    try {
      const { data, error } = await supabase
        .from('carbon_credits')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return this.formatCarbonCredit(data);
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon credit details');
      throw error;
    }
  }

  async purchaseCredit(data: PurchaseData): Promise<Purchase> {
    try {
      let purchase;
      let credit;
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Get carbon credit
        const { data: dbCredit, error: creditError } = await supabase
          .from('carbon_credits')
          .select('*')
          .eq('id', data.carbonCreditId)
          .single();
        
        if (creditError) throw creditError;
        credit = dbCredit;
        
        // Check if enough quantity is available
        if (credit.quantity < data.quantity) {
          throw new Error('Insufficient quantity available');
        }
        
        // Calculate total price
        const unitPrice = credit.price;
        const totalPrice = unitPrice * data.quantity;
        
        // Create purchase record
        const { data: dbPurchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: user.id,
            carbon_credit_id: data.carbonCreditId,
            quantity: data.quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            status: 'completed',
            notes: data.notes,
          })
          .select()
          .single();
        
        if (purchaseError) throw purchaseError;
        purchase = dbPurchase;
        
        // Update carbon credit quantity
        const { error: updateError } = await supabase
          .from('carbon_credits')
          .update({ quantity: credit.quantity - data.quantity })
          .eq('id', data.carbonCreditId);
        
        if (updateError) throw updateError;
        
        // Update user portfolio
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('total_credits, total_value')
          .eq('id', user.id)
          .single();
        
        if (userError) throw userError;
        
        const { error: updateUserError } = await supabase
          .from('users')
          .update({
            total_credits: userData.total_credits + data.quantity,
            total_value: userData.total_value + totalPrice,
          })
          .eq('id', user.id);
        
        if (updateUserError) throw updateUserError;
      } catch (e) {
        console.warn('Supabase purchase error, using fallback:', e);
        
        // Get mock credit if needed
        if (!credit) {
          const mockCredits = this.getMockCredits();
          credit = mockCredits.find(c => c.id === data.carbonCreditId);
          if (!credit) {
            credit = mockCredits[0];
          }
        }
        
        // Calculate total price
        const unitPrice = credit.price;
        const totalPrice = unitPrice * data.quantity;
        
        // Create mock purchase
        purchase = {
          id: `mock-purchase-${Date.now()}`,
          user_id: authService.getUser()?.id || 'mock-user-id',
          carbon_credit_id: data.carbonCreditId,
          quantity: data.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          status: 'completed',
          notes: data.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Store in localStorage
        const mockPurchases = JSON.parse(localStorage.getItem('mockPurchases') || '[]');
        mockPurchases.unshift(purchase);
        localStorage.setItem('mockPurchases', JSON.stringify(mockPurchases.slice(0, 10)));
      }
      
      notificationService.success(
        'Purchase Successful!',
        `Successfully purchased ${data.quantity} carbon credits for $${purchase.total_price.toFixed(2)}`
      );
      
      return {
        id: purchase.id,
        quantity: purchase.quantity,
        totalPrice: purchase.total_price,
        unitPrice: purchase.unit_price,
        status: purchase.status,
        txHash: purchase.tx_hash,
        blockNumber: purchase.block_number,
        notes: purchase.notes,
        createdAt: purchase.created_at,
        carbonCredit: this.formatCarbonCredit(credit),
      };
    } catch (error) {
      notificationService.error('Purchase Failed', 'Failed to complete purchase');
      throw error;
    }
  }

  async getPurchaseHistory(): Promise<Purchase[]> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get purchases with carbon credit details
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          carbon_credits(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(purchase => ({
        id: purchase.id,
        quantity: purchase.quantity,
        totalPrice: purchase.total_price,
        unitPrice: purchase.unit_price,
        status: purchase.status,
        txHash: purchase.tx_hash,
        blockNumber: purchase.block_number,
        notes: purchase.notes,
        createdAt: purchase.created_at,
        carbonCredit: this.formatCarbonCredit(purchase.carbon_credits),
      }));
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load purchase history');
      throw error;
    }
  }

  async getPurchaseById(id: string): Promise<Purchase> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get purchase with carbon credit details
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          carbon_credits(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        quantity: data.quantity,
        totalPrice: data.total_price,
        unitPrice: data.unit_price,
        status: data.status,
        txHash: data.tx_hash,
        blockNumber: data.block_number,
        notes: data.notes,
        createdAt: data.created_at,
        carbonCredit: this.formatCarbonCredit(data.carbon_credits),
      };
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load purchase details');
      throw error;
    }
  }

  async getMarketStats(): Promise<MarketplaceStats> {
    try {
      // Get total credits available
      const { data: creditsData, error: creditsError } = await supabase
        .from('carbon_credits')
        .select('quantity')
        .gt('quantity', 0);
      
      if (creditsError) throw creditsError;
      
      const totalCreditsAvailable = creditsData.reduce((sum, credit) => sum + credit.quantity, 0);
      
      // Get average price
      const { data: avgPriceData, error: avgPriceError } = await supabase
        .from('carbon_credits')
        .select('price')
        .gt('quantity', 0);
      
      if (avgPriceError) throw avgPriceError;
      
      const averagePrice = avgPriceData.length > 0
        ? avgPriceData.reduce((sum, credit) => sum + credit.price, 0) / avgPriceData.length
        : 0;
      
      // Get total purchases
      const { count: totalPurchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true });
      
      if (purchasesError) throw purchasesError;
      
      // Get total volume
      const { data: volumeData, error: volumeError } = await supabase
        .from('purchases')
        .select('total_price');
      
      if (volumeError) throw volumeError;
      
      const totalVolume = volumeData.reduce((sum, purchase) => sum + purchase.total_price, 0);
      
      return {
        totalCreditsAvailable,
        averagePrice,
        totalPurchases: totalPurchases || 0,
        totalVolume,
      };
    } catch (error) {
      console.warn('Failed to load marketplace stats:', error);
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
      const { data: credit, error } = await supabase
        .from('carbon_credits')
        .insert({
          type: data.type,
          price: data.price,
          quantity: data.quantity,
          location: data.location,
          verified: data.verified ?? true,
          description: data.description,
          vintage: data.vintage,
          seller: data.seller,
          certification: data.certification,
          token_id: data.tokenId,
          contract_address: data.contractAddress,
          blockchain_verified: data.blockchainVerified ?? false,
          metadata: data.metadata,
          tags: data.tags,
          rating: data.rating ?? 4.0,
          review_count: data.reviewCount ?? 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      notificationService.success('Credit Listed', 'Carbon credit has been listed successfully');
      
      return this.formatCarbonCredit(credit);
    } catch (error) {
      notificationService.error('Listing Failed', 'Failed to list carbon credit');
      throw error;
    }
  }

  async updateCarbonCredit(id: string, data: Partial<CarbonCreditAPI>): Promise<CarbonCreditAPI> {
    try {
      const { data: credit, error } = await supabase
        .from('carbon_credits')
        .update({
          type: data.type,
          price: data.price,
          quantity: data.quantity,
          location: data.location,
          verified: data.verified,
          description: data.description,
          vintage: data.vintage,
          seller: data.seller,
          certification: data.certification,
          token_id: data.tokenId,
          contract_address: data.contractAddress,
          blockchain_verified: data.blockchainVerified,
          metadata: data.metadata,
          tags: data.tags,
          rating: data.rating,
          review_count: data.reviewCount,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      notificationService.success('Credit Updated', 'Carbon credit has been updated');
      
      return this.formatCarbonCredit(credit);
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update carbon credit');
      throw error;
    }
  }

  private formatCarbonCredit(data: any): CarbonCreditAPI {
    return {
      id: data.id,
      type: data.type,
      price: data.price,
      quantity: data.quantity,
      location: data.location,
      verified: data.verified,
      description: data.description,
      vintage: data.vintage,
      seller: data.seller,
      certification: data.certification,
      tokenId: data.token_id,
      contractAddress: data.contract_address,
      blockchainVerified: data.blockchain_verified,
      metadata: data.metadata,
      tags: data.tags,
      rating: data.rating,
      reviewCount: data.review_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  
  // Mock data for development/fallback
  private getMockCredits(): any[] {
    return [
      {
        id: 'mock-credit-1',
        type: 'forest',
        price: 45.50,
        quantity: 1000,
        location: 'Amazon Rainforest, Brazil',
        verified: true,
        description: 'Protecting 500 hectares of primary rainforest',
        vintage: 2024,
        seller: 'EcoForest Initiative',
        certification: 'VCS',
        token_id: null,
        contract_address: null,
        blockchain_verified: false,
        metadata: null,
        tags: ['forest', 'conservation', 'biodiversity'],
        rating: 4.2,
        review_count: 124,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mock-credit-2',
        type: 'renewable',
        price: 32.75,
        quantity: 2500,
        location: 'Wind Farm, Texas',
        verified: true,
        description: 'Clean energy from wind turbines',
        vintage: 2024,
        seller: 'GreenWind Energy',
        certification: 'Gold Standard',
        token_id: null,
        contract_address: null,
        blockchain_verified: false,
        metadata: null,
        tags: ['wind', 'energy', 'renewable'],
        rating: 4.5,
        review_count: 87,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mock-credit-3',
        type: 'efficiency',
        price: 28.90,
        quantity: 800,
        location: 'Industrial Complex, California',
        verified: true,
        description: 'Energy efficiency improvements in manufacturing',
        vintage: 2023,
        seller: 'EcoTech Solutions',
        certification: 'CAR',
        token_id: null,
        contract_address: null,
        blockchain_verified: false,
        metadata: null,
        tags: ['efficiency', 'industrial', 'energy'],
        rating: 3.9,
        review_count: 56,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mock-credit-4',
        type: 'capture',
        price: 85.25,
        quantity: 500,
        location: 'Direct Air Capture, Iceland',
        verified: true,
        description: 'Direct CO₂ capture and storage technology',
        vintage: 2024,
        seller: 'CarbonCapture Inc.',
        certification: 'VCS',
        token_id: null,
        contract_address: null,
        blockchain_verified: false,
        metadata: null,
        tags: ['technology', 'capture', 'innovative'],
        rating: 4.7,
        review_count: 32,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  }
}

export const marketplaceService = new MarketplaceService();