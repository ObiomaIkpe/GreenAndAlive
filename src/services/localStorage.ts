export interface UserData {
  carbonFootprint: {
    electricity: number;
    transportation: number;
    heating: number;
    airTravel: number;
    totalEmissions: number;
    lastCalculated: string;
  };
  preferences: {
    location: string;
    lifestyle: string[];
    budget: number;
    notifications: boolean;
    theme: 'light' | 'dark';
  };
  portfolio: {
    totalCredits: number;
    totalValue: number;
    monthlyOffset: number;
    reductionGoal: number;
    achievements: string[];
  };
  marketplace: {
    cart: CartItem[];
    wishlist: string[];
    purchaseHistory: Purchase[];
  };
  aiRecommendations: {
    implemented: string[];
    dismissed: string[];
    lastUpdated: string;
  };
}

export interface CartItem {
  id: string;
  type: string;
  price: number;
  quantity: number;
  description: string;
  seller: string;
}

export interface Purchase {
  id: string;
  creditId: string;
  quantity: number;
  totalPrice: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'carbonai_user_data';
  private readonly VERSION = '1.0';

  private getDefaultData(): UserData {
    return {
      carbonFootprint: {
        electricity: 800,
        transportation: 1200,
        heating: 100,
        airTravel: 4,
        totalEmissions: 0,
        lastCalculated: new Date().toISOString()
      },
      preferences: {
        location: 'San Francisco, CA',
        lifestyle: ['urban', 'tech_worker'],
        budget: 500,
        notifications: true,
        theme: 'light'
      },
      portfolio: {
        totalCredits: 1247,
        totalValue: 52850,
        monthlyOffset: 18.5,
        reductionGoal: 24.0,
        achievements: [
          'Carbon Neutral Champion - Achieved 3 consecutive months',
          'Forest Protector - 100+ conservation credits purchased',
          'Efficiency Expert - 30% emission reduction achieved'
        ]
      },
      marketplace: {
        cart: [],
        wishlist: [],
        purchaseHistory: []
      },
      aiRecommendations: {
        implemented: [],
        dismissed: [],
        lastUpdated: new Date().toISOString()
      }
    };
  }

  public getUserData(): UserData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === this.VERSION) {
          return { ...this.getDefaultData(), ...parsed.data };
        }
      }
    } catch (error) {
      console.warn('Failed to load user data from localStorage:', error);
    }
    return this.getDefaultData();
  }

  public saveUserData(data: Partial<UserData>): void {
    try {
      const currentData = this.getUserData();
      const updatedData = this.deepMerge(currentData, data);
      
      const toStore = {
        version: this.VERSION,
        data: updatedData,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save user data to localStorage:', error);
    }
  }

  public updateCarbonFootprint(footprint: Partial<UserData['carbonFootprint']>): void {
    const currentData = this.getUserData();
    this.saveUserData({
      carbonFootprint: {
        ...currentData.carbonFootprint,
        ...footprint,
        lastCalculated: new Date().toISOString()
      }
    });
  }

  public updatePreferences(preferences: Partial<UserData['preferences']>): void {
    const currentData = this.getUserData();
    this.saveUserData({
      preferences: {
        ...currentData.preferences,
        ...preferences
      }
    });
  }

  public addToCart(item: CartItem): void {
    const currentData = this.getUserData();
    const existingItem = currentData.marketplace.cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      currentData.marketplace.cart.push(item);
    }
    
    this.saveUserData({ marketplace: currentData.marketplace });
  }

  public removeFromCart(itemId: string): void {
    const currentData = this.getUserData();
    currentData.marketplace.cart = currentData.marketplace.cart.filter(item => item.id !== itemId);
    this.saveUserData({ marketplace: currentData.marketplace });
  }

  public updateCartQuantity(itemId: string, quantity: number): void {
    const currentData = this.getUserData();
    const item = currentData.marketplace.cart.find(cartItem => cartItem.id === itemId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.saveUserData({ marketplace: currentData.marketplace });
      }
    }
  }

  public clearCart(): void {
    const currentData = this.getUserData();
    currentData.marketplace.cart = [];
    this.saveUserData({ marketplace: currentData.marketplace });
  }

  public addPurchase(purchase: Purchase): void {
    const currentData = this.getUserData();
    currentData.marketplace.purchaseHistory.unshift(purchase);
    
    // Update portfolio
    if (purchase.status === 'completed') {
      currentData.portfolio.totalCredits += purchase.quantity;
      currentData.portfolio.totalValue += purchase.totalPrice;
    }
    
    this.saveUserData({
      marketplace: currentData.marketplace,
      portfolio: currentData.portfolio
    });
  }

  public toggleWishlist(creditId: string): void {
    const currentData = this.getUserData();
    const index = currentData.marketplace.wishlist.indexOf(creditId);
    
    if (index > -1) {
      currentData.marketplace.wishlist.splice(index, 1);
    } else {
      currentData.marketplace.wishlist.push(creditId);
    }
    
    this.saveUserData({ marketplace: currentData.marketplace });
  }

  public implementRecommendation(recommendationId: string): void {
    const currentData = this.getUserData();
    if (!currentData.aiRecommendations.implemented.includes(recommendationId)) {
      currentData.aiRecommendations.implemented.push(recommendationId);
      currentData.aiRecommendations.lastUpdated = new Date().toISOString();
      this.saveUserData({ aiRecommendations: currentData.aiRecommendations });
    }
  }

  public dismissRecommendation(recommendationId: string): void {
    const currentData = this.getUserData();
    if (!currentData.aiRecommendations.dismissed.includes(recommendationId)) {
      currentData.aiRecommendations.dismissed.push(recommendationId);
      currentData.aiRecommendations.lastUpdated = new Date().toISOString();
      this.saveUserData({ aiRecommendations: currentData.aiRecommendations });
    }
  }

  public exportData(): string {
    const data = this.getUserData();
    return JSON.stringify(data, null, 2);
  }

  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.saveUserData(data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  public clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

export const localStorageService = new LocalStorageService();