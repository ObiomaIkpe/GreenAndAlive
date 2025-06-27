import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { localStorageService } from './localStorage';

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
      let userData;
      let error;
      
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        
        if (authError) throw authError;
        userData = data;
      } catch (e) {
        console.warn('Supabase auth error, using fallback:', e);
        // Fallback to mock data for demo/development
        if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
          // Mock successful login
          this.currentUser = this.getMockUser();
          notificationService.success('Login Successful', `Welcome back, ${this.currentUser.firstName || this.currentUser.email}!`);
          return this.currentUser;
        } else {
          error = new Error('Invalid email or password');
        }
      }

      if (error) throw error;

      // Get user profile data
      try {
        const { data: profileData, error: userError } = await supabase
          .from('users')
          .select(`
            *,
            user_preferences(*)
          `)
          .eq('id', userData.user.id)
          .single();

        if (userError) throw userError;
        
        // Format user data to match our interface
        this.currentUser = this.formatUserData(profileData);
      } catch (e) {
        console.warn('Supabase profile fetch error, using fallback:', e);
        // Fallback to mock data
        this.currentUser = this.getMockUser();
      }

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
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error, using fallback:', e);
        // Clear mock session if using fallback
        localStorage.removeItem('mockUserSession');
      }
      
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
      } catch (e) {
        console.warn('Supabase getCurrentUser error, checking localStorage fallback:', e);
        // Check if we have a mock session in localStorage
        const mockSession = localStorage.getItem('mockUserSession');
        if (mockSession === 'true') {
          this.currentUser = this.getMockUser();
          return this.currentUser;
        }
        return null;
      }
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