import { supabase } from './supabaseClient';
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

class AuthService {
  private currentUser: User | null = null;

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          user_preferences(*)
        `)
        .eq('id', data.user.id)
        .single();

      if (userError) throw userError;

      // Format user data to match our interface
      this.currentUser = this.formatUserData(userData);
      
      notificationService.success('Login Successful', `Welcome back, ${this.currentUser.firstName || this.currentUser.email}!`);
      
      return this.currentUser;
    } catch (error) {
      notificationService.error('Login Failed', 'Invalid email or password');
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          wallet_address: data.walletAddress,
          total_credits: 0,
          total_value: 0,
          monthly_offset: 0,
          reduction_goal: 24,
          token_balance: 0,
          staking_rewards: 0,
          reputation_score: 50,
          achievements: [],
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: authData.user?.id,
          location: 'San Francisco, CA',
          lifestyle: ['urban', 'tech_worker'],
          budget: 500,
          notifications: true,
          theme: 'light',
          preferences: ['renewable_energy', 'forest_conservation'],
          risk_tolerance: 'medium',
        })
        .select()
        .single();

      if (preferencesError) throw preferencesError;

      // Format user data
      this.currentUser = {
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
        preferences: {
          location: preferencesData.location,
          lifestyle: preferencesData.lifestyle,
          budget: preferencesData.budget,
          notifications: preferencesData.notifications,
          theme: preferencesData.theme,
          preferences: preferencesData.preferences,
          riskTolerance: preferencesData.risk_tolerance,
        },
      };
      
      notificationService.success('Registration Successful', 'Welcome to CarbonAI!');
      
      return this.currentUser;
    } catch (error) {
      notificationService.error('Registration Failed', 'Please check your information and try again');
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
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

    try {
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData.user) return null;

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          user_preferences(*)
        `)
        .eq('id', authData.user.id)
        .single();

      if (userError) throw userError;

      // Format user data
      this.currentUser = this.formatUserData(userData);
      return this.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      if (!this.currentUser) throw new Error('User not authenticated');

      const { data: userData, error } = await supabase
        .from('users')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          wallet_address: data.walletAddress,
        })
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Update current user
      this.currentUser = {
        ...this.currentUser,
        firstName: userData.first_name,
        lastName: userData.last_name,
        walletAddress: userData.wallet_address,
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

      const { data: preferencesData, error } = await supabase
        .from('user_preferences')
        .update({
          location: preferences.location,
          lifestyle: preferences.lifestyle,
          budget: preferences.budget,
          notifications: preferences.notifications,
          theme: preferences.theme,
          preferences: preferences.preferences,
          risk_tolerance: preferences.riskTolerance,
        })
        .eq('user_id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Update current user
      if (this.currentUser.preferences) {
        this.currentUser.preferences = {
          ...this.currentUser.preferences,
          location: preferencesData.location,
          lifestyle: preferencesData.lifestyle,
          budget: preferencesData.budget,
          notifications: preferencesData.notifications,
          theme: preferencesData.theme,
          preferences: preferencesData.preferences,
          riskTolerance: preferencesData.risk_tolerance,
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
        location: userData.user_preferences.location,
        lifestyle: userData.user_preferences.lifestyle,
        budget: userData.user_preferences.budget,
        notifications: userData.user_preferences.notifications,
        theme: userData.user_preferences.theme,
        preferences: userData.user_preferences.preferences,
        riskTolerance: userData.user_preferences.risk_tolerance,
      } : undefined,
    };
  }
}

export const authService = new AuthService();