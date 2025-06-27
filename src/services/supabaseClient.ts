import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment';

const supabaseUrl = config.supabase?.url || '';
const supabaseAnonKey = config.supabase?.anonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          wallet_address: string | null;
          total_credits: number;
          total_value: number;
          monthly_offset: number;
          reduction_goal: number;
          token_balance: number;
          staking_rewards: number;
          reputation_score: number;
          achievements: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          wallet_address?: string | null;
          total_credits?: number;
          total_value?: number;
          monthly_offset?: number;
          reduction_goal?: number;
          token_balance?: number;
          staking_rewards?: number;
          reputation_score?: number;
          achievements?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          wallet_address?: string | null;
          total_credits?: number;
          total_value?: number;
          monthly_offset?: number;
          reduction_goal?: number;
          token_balance?: number;
          staking_rewards?: number;
          reputation_score?: number;
          achievements?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          location: string;
          lifestyle: string[];
          budget: number;
          notifications: boolean;
          theme: string;
          preferences: string[];
          risk_tolerance: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location?: string;
          lifestyle?: string[];
          budget?: number;
          notifications?: boolean;
          theme?: string;
          preferences?: string[];
          risk_tolerance?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location?: string;
          lifestyle?: string[];
          budget?: number;
          notifications?: boolean;
          theme?: string;
          preferences?: string[];
          risk_tolerance?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      carbon_footprints: {
        Row: {
          id: string;
          user_id: string;
          electricity: number;
          transportation: number;
          heating: number;
          air_travel: number;
          total_emissions: number;
          calculation_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          electricity: number;
          transportation: number;
          heating: number;
          air_travel: number;
          total_emissions: number;
          calculation_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          electricity?: number;
          transportation?: number;
          heating?: number;
          air_travel?: number;
          total_emissions?: number;
          calculation_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      carbon_credits: {
        Row: {
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
          token_id: string | null;
          contract_address: string | null;
          blockchain_verified: boolean;
          metadata: string | null;
          tags: string[] | null;
          rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          price: number;
          quantity: number;
          location: string;
          verified?: boolean;
          description: string;
          vintage: number;
          seller: string;
          certification: string;
          token_id?: string | null;
          contract_address?: string | null;
          blockchain_verified?: boolean;
          metadata?: string | null;
          tags?: string[] | null;
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          price?: number;
          quantity?: number;
          location?: string;
          verified?: boolean;
          description?: string;
          vintage?: number;
          seller?: string;
          certification?: string;
          token_id?: string | null;
          contract_address?: string | null;
          blockchain_verified?: boolean;
          metadata?: string | null;
          tags?: string[] | null;
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          carbon_credit_id: string;
          quantity: number;
          total_price: number;
          unit_price: number;
          status: string;
          tx_hash: string | null;
          block_number: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          carbon_credit_id: string;
          quantity: number;
          total_price: number;
          unit_price: number;
          status?: string;
          tx_hash?: string | null;
          block_number?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          carbon_credit_id?: string;
          quantity?: number;
          total_price?: number;
          unit_price?: number;
          status?: string;
          tx_hash?: string | null;
          block_number?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_recommendations: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string;
          impact: number;
          confidence: number;
          category: string;
          reward_potential: number | null;
          action_steps: string[];
          estimated_cost: number | null;
          timeframe: string;
          priority: string;
          implemented: boolean;
          dismissed: boolean;
          implementation_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          description: string;
          impact: number;
          confidence: number;
          category: string;
          reward_potential?: number | null;
          action_steps?: string[];
          estimated_cost?: number | null;
          timeframe?: string;
          priority?: string;
          implemented?: boolean;
          dismissed?: boolean;
          implementation_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          description?: string;
          impact?: number;
          confidence?: number;
          category?: string;
          reward_potential?: number | null;
          action_steps?: string[];
          estimated_cost?: number | null;
          timeframe?: string;
          priority?: string;
          implemented?: boolean;
          dismissed?: boolean;
          implementation_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};