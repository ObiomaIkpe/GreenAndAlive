import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment';

// Check if Supabase credentials are properly configured
const supabaseUrl = config.supabase?.url;
const supabaseAnonKey = config.supabase?.anonKey;

// Validate that we have real Supabase credentials, not placeholders
const isValidUrl = supabaseUrl && supabaseUrl !== 'your-supabase-url' && supabaseUrl.startsWith('https://');
const isValidKey = supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key' && supabaseAnonKey.length > 50;

if (!isValidUrl || !isValidKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Create client with fallback handling and error catching
export const supabase = (() => {
  // Only attempt to create real client if we have valid credentials
  if (isValidUrl && isValidKey) {
    try {
      return createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      // Fall through to mock client
    }
  }
  
  // Return mock client for development when Supabase is not configured
  console.info('Using mock Supabase client - configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for real functionality');
  return createMockSupabaseClient();
})();

// Mock Supabase client for development
function createMockSupabaseClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Mock Supabase client - please configure real credentials') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Mock Supabase client - please configure real credentials') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Mock Supabase client - please configure real credentials') }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          range: () => Promise.resolve({ data: [], error: null })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        limit: () => Promise.resolve({ data: [], error: null }),
        ilike: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        }),
        gt: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        }),
        gte: () => ({
          andWhere: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Mock Supabase client - please configure real credentials') })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Mock Supabase client - please configure real credentials') })
          })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      }),
      count: () => ({
        eq: () => Promise.resolve({ count: 0, error: null })
      })
    })
  };
}

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