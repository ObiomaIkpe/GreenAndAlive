import { apiService } from './api';
import { notificationService } from './notificationService';

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

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private currentUser: User | null = null;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      // Store auth token
      apiService.setAuthToken(response.token);
      this.currentUser = response.user;
      
      notificationService.success('Login Successful', `Welcome back, ${response.user.firstName || response.user.email}!`);
      
      return response;
    } catch (error) {
      notificationService.error('Login Failed', 'Invalid email or password');
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', data);
      
      // Store auth token
      apiService.setAuthToken(response.token);
      this.currentUser = response.user;
      
      notificationService.success('Registration Successful', 'Welcome to CarbonAI!');
      
      return response;
    } catch (error) {
      notificationService.error('Registration Failed', 'Please check your information and try again');
      throw error;
    }
  }

  async logout(): Promise<void> {
    apiService.clearAuthToken();
    this.currentUser = null;
    notificationService.info('Logged Out', 'You have been successfully logged out');
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const user = await apiService.get<User>('/auth/profile');
      this.currentUser = user;
      return user;
    } catch (error) {
      return null;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const updatedUser = await apiService.patch<User>('/users/profile', data);
      this.currentUser = updatedUser;
      
      notificationService.success('Profile Updated', 'Your profile has been updated successfully');
      
      return updatedUser;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update profile');
      throw error;
    }
  }

  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    try {
      const updatedUser = await apiService.patch<User>('/users/preferences', preferences);
      this.currentUser = updatedUser;
      
      notificationService.success('Preferences Updated', 'Your preferences have been saved');
      
      return updatedUser;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update preferences');
      throw error;
    }
  }

  async updateWalletAddress(walletAddress: string): Promise<User> {
    try {
      const updatedUser = await apiService.patch<User>('/users/wallet', { walletAddress });
      this.currentUser = updatedUser;
      
      notificationService.success('Wallet Connected', 'Your wallet address has been updated');
      
      return updatedUser;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update wallet address');
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUser || !!localStorage.getItem('carbonai_auth_token');
  }

  getUser(): User | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();