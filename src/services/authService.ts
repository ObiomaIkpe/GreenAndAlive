import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { localStorageService } from './localStorage';
import { aiMetricsService } from './aiMetricsService';
import { API_CONFIG } from '../config/environment';

// Test backend connection
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  totalCredits: number;
  totalValue: number;
  monthlyOffset: number;
  reductionGoal: number;
  tokenBalance: number;
  stakingRewards: number;
  reputationScore: number;
  achievements: string[];
  preferences?: {
    location: string;
    lifestyle: string[];
    budget: number;
    notifications: boolean;
    theme: string;
    preferences: string[];
    riskTolerance: string;
  };
}

class AuthService {
  private currentUser: User | null = null;

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Call the backend API for login
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Set the auth token in localStorage and API service
      localStorage.setItem('carbonledgerai_auth_token', data.token);
      
      // Format user data
      this.currentUser = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        walletAddress: data.user.walletAddress,
        totalCredits: data.user.totalCredits || 0,
        totalValue: data.user.totalValue || 0,
        monthlyOffset: data.user.monthlyOffset || 0,
        reductionGoal: data.user.reductionGoal || 24,
        tokenBalance: data.user.tokenBalance || 0,
        stakingRewards: data.user.stakingRewards || 0,
        reputationScore: data.user.reputationScore || 50,
        achievements: data.user.achievements || [],
        preferences: data.user.preferences || {
          location: 'San Francisco, CA',
          lifestyle: ['urban', 'tech_worker'],
          budget: 500,
          notifications: true,
          theme: 'light',
          preferences: ['renewable_energy', 'forest_conservation'],
          riskTolerance: 'medium',
        },
      };

      // Sync any locally stored AI metrics
      aiMetricsService.syncLocalMetrics(data.user.id);

      notificationService.success('Login Successful', `Welcome back, ${this.currentUser.firstName || this.currentUser.email}!`);
      
      return this.currentUser;
    } catch (error) {
      notificationService.error('Login Failed', 'Invalid email or password');
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      // Call the backend API for registration
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const responseData = await response.json();
      
      // Set the auth token in localStorage
      localStorage.setItem('carbonledgerai_auth_token', responseData.token);
      
      // Format user data to match our interface
      this.currentUser = {
        id: responseData.user.id,
        email: responseData.user.email,
        firstName: responseData.user.firstName,
        lastName: responseData.user.lastName,
        walletAddress: responseData.user.walletAddress,
        totalCredits: 0,
        totalValue: 0,
        monthlyOffset: 0,
        reductionGoal: 24,
        tokenBalance: 0,
        stakingRewards: 0,
        reputationScore: 50,
        achievements: [],
        preferences: {
          location: 'San Francisco, CA',
          lifestyle: ['urban', 'tech_worker'],
          budget: 500,
          notifications: true,
          theme: 'light',
          preferences: ['renewable_energy', 'forest_conservation'],
          riskTolerance: 'medium',
        },
      };
      
      notificationService.success('Registration Successful', 'Welcome to CarbonledgerAI!');
      
      return this.currentUser;
    } catch (error) {
      notificationService.error('Registration Failed', 'Please check your information and try again');
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear auth token
      localStorage.removeItem('carbonledgerai_auth_token');
      
      this.currentUser = null;
      notificationService.info('Logged Out', 'You have been successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser; 
    }
    
    // Check if we have a token
    const token = localStorage.getItem('carbonledgerai_auth_token');
    if (!token) {
      return null;
    }

    try {
      // Call the backend API to get user profile
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If token is invalid, clear it
        localStorage.removeItem('carbonledgerai_auth_token');
        return null;
      }

      const data = await response.json();
      
      // Format user data
      this.currentUser = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        walletAddress: data.user.walletAddress,
        totalCredits: data.user.totalCredits || 0,
        totalValue: data.user.totalValue || 0,
        monthlyOffset: data.user.monthlyOffset || 0,
        reductionGoal: data.user.reductionGoal || 24,
        tokenBalance: data.user.tokenBalance || 0,
        stakingRewards: data.user.stakingRewards || 0,
        reputationScore: data.user.reputationScore || 50,
        achievements: data.user.achievements || [],
        preferences: data.user.preferences || {
          location: 'San Francisco, CA',
          lifestyle: ['urban', 'tech_worker'],
          budget: 500,
          notifications: true,
          theme: 'light',
          preferences: ['renewable_energy', 'forest_conservation'],
          riskTolerance: 'medium',
        },
      };
      
      return this.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      if (!this.currentUser) throw new Error('User not authenticated');
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) throw new Error('Not authenticated');

      // Call the backend API to update profile
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          walletAddress: data.walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Profile update failed');
      }

      const responseData = await response.json();

      // Update current user
      this.currentUser = {
        ...this.currentUser,
        firstName: responseData.user.firstName,
        lastName: responseData.user.lastName,
        walletAddress: responseData.user.walletAddress,
      };
      
      notificationService.success('Profile Updated', 'Your profile has been updated successfully');
      
      return this.currentUser;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update profile');
      throw error;
    }
  }

  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    try {
      if (!this.currentUser) throw new Error('User not authenticated');
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) throw new Error('Not authenticated');

      // Call the backend API to update preferences
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/users/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: preferences.location,
          lifestyle: preferences.lifestyle,
          budget: preferences.budget,
          notifications: preferences.notifications,
          theme: preferences.theme,
          preferences: preferences.preferences,
          riskTolerance: preferences.riskTolerance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Preferences update failed');
      }

      const responseData = await response.json();

      // Update current user
      if (this.currentUser.preferences) {
        this.currentUser.preferences = {
          ...this.currentUser.preferences,
          location: responseData.preferences.location,
          lifestyle: responseData.preferences.lifestyle,
          budget: responseData.preferences.budget,
          notifications: responseData.preferences.notifications,
          theme: responseData.preferences.theme,
          preferences: responseData.preferences.preferences,
          riskTolerance: responseData.preferences.riskTolerance,
        };
      }
      
      notificationService.success('Preferences Updated', 'Your preferences have been saved');
      
      return this.currentUser;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update preferences');
      throw error;
    }
  }

  async updateWalletAddress(walletAddress: string): Promise<User> {
    try {
      if (!this.currentUser) throw new Error('User not authenticated');

      const { data: userData, error } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Update current user
      this.currentUser.walletAddress = userData.wallet_address;
      
      notificationService.success('Wallet Connected', 'Your wallet address has been updated');
      
      return this.currentUser;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update wallet address');
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  private formatUserData(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      walletAddress: userData.wallet_address,
      totalCredits: userData.total_credits,
      totalValue: userData.total_value,
      monthlyOffset: userData.monthly_offset,
      reductionGoal: userData.reduction_goal,
      tokenBalance: userData.token_balance,
      stakingRewards: userData.staking_rewards,
      reputationScore: userData.reputation_score,
      achievements: userData.achievements || [],
      preferences: userData.user_preferences ? {
        location: userData.user_preferences.location || 'San Francisco, CA',
        lifestyle: userData.user_preferences.lifestyle || ['urban', 'tech_worker'],
        budget: userData.user_preferences.budget || 500,
        notifications: userData.user_preferences.notifications !== undefined ? userData.user_preferences.notifications : true,
        theme: userData.user_preferences.theme || 'light',
        preferences: userData.user_preferences.preferences || ['renewable_energy', 'forest_conservation'],
        riskTolerance: userData.user_preferences.risk_tolerance || 'medium',
      } : undefined,
    };
  }
  
  // Mock user for development/fallback
  private getMockUser(): User {
    // Store mock session in localStorage
    localStorage.setItem('mockUserSession', 'true');
    
    return {
      id: 'mock-user-id',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      totalCredits: 1247,
      totalValue: 52850,
      monthlyOffset: 18.5,
      reductionGoal: 24.0,
      tokenBalance: 1247,
      stakingRewards: 156.5,
      reputationScore: 85,
      achievements: [
        'Carbon Neutral Champion - Achieved 3 consecutive months',
        'Forest Protector - 100+ conservation credits purchased',
        'Efficiency Expert - 30% emission reduction achieved'
      ],
      preferences: {
        location: 'San Francisco, CA',
        lifestyle: ['urban', 'tech_worker'],
        budget: 500,
        notifications: true,
        theme: 'light',
        preferences: ['renewable_energy', 'forest_conservation'],
        riskTolerance: 'medium',
      }
    };
  }
}

export const authService = new AuthService();