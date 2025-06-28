import { supabase } from './supabaseClient';
import { config } from '../config/environment';
import { v4 as uuidv4 } from 'uuid';

export interface OpenAIUsageData {
  model: string;
  endpoint: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  responseTimeMs?: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for tracking OpenAI API usage
 */
class OpenAIUsageService {
  private isEnabled: boolean;
  private usageQueue: (OpenAIUsageData & { requestId: string })[] = [];
  private isProcessingQueue: boolean = false;
  private flushInterval: number = 10000; // 10 seconds
  private intervalId: number | null = null;
  private localStorageKey: string = 'carbonai_openai_usage_queue';

  constructor() {
    // Enable tracking by default in production
    this.isEnabled = config.isProduction || true;
    
    // Start the flush interval
    if (this.isEnabled) {
      this.startFlushInterval();
    }
  }

  /**
   * Track an OpenAI API request
   */
  public trackRequest(data: OpenAIUsageData): string {
    if (!this.isEnabled) return '';
    
    const requestId = uuidv4();
    
    this.usageQueue.push({
      ...data,
      requestId
    });
    
    // If queue gets too large, flush immediately
    if (this.usageQueue.length >= 10) {
      this.flushUsage();
    }
    
    return requestId;
  }

  /**
   * Update an existing request with response data
   */
  public updateRequest(requestId: string, data: Partial<OpenAIUsageData>): void {
    if (!this.isEnabled || !requestId) return;
    
    const index = this.usageQueue.findIndex(item => item.requestId === requestId);
    
    if (index !== -1) {
      this.usageQueue[index] = {
        ...this.usageQueue[index],
        ...data
      };
    }
  }

  /**
   * Enable or disable usage tracking
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled && !this.intervalId) {
      this.startFlushInterval();
    } else if (!enabled && this.intervalId) {
      this.stopFlushInterval();
    }
  }

  /**
   * Start the interval to periodically flush usage data
   */
  private startFlushInterval(): void {
    if (this.intervalId) return;
    
    this.intervalId = window.setInterval(() => {
      this.flushUsage();
    }, this.flushInterval);
  }

  /**
   * Stop the flush interval
   */
  private stopFlushInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Flush usage data to the database
   */
  private async flushUsage(): Promise<void> {
    if (this.isProcessingQueue || this.usageQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    const usageToFlush = [...this.usageQueue];
    this.usageQueue = [];
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Format usage data for database
        const formattedUsage = usageToFlush.map(usage => ({
          user_id: user.id,
          request_id: usage.requestId,
          model: usage.model,
          endpoint: usage.endpoint,
          prompt_tokens: usage.promptTokens,
          completion_tokens: usage.completionTokens,
          total_tokens: usage.totalTokens,
          response_time_ms: usage.responseTimeMs,
          success: usage.success,
          error_code: usage.errorCode,
          error_message: usage.errorMessage,
          metadata: usage.metadata ? JSON.stringify(usage.metadata) : null
        }));
        
        // Insert usage data into database
        const { error } = await supabase
          .from('openai_api_usage')
          .insert(formattedUsage);
        
        if (error) {
          console.warn('Failed to save OpenAI API usage:', error);
          // Put usage data back in queue to try again later
          this.usageQueue = [...usageToFlush, ...this.usageQueue];
        }
      } else {
        // Store usage data in localStorage if user is not authenticated
        const storedUsage = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
        localStorage.setItem(this.localStorageKey, JSON.stringify([...storedUsage, ...usageToFlush]));
      }
    } catch (error) {
      console.warn('Error flushing OpenAI API usage:', error);
      // Put usage data back in queue to try again later
      this.usageQueue = [...usageToFlush, ...this.usageQueue];
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Sync usage data from localStorage to database when user logs in
   */
  public async syncLocalUsage(userId: string): Promise<void> {
    try {
      const storedUsage = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      if (storedUsage.length === 0) return;
      
      // Format usage data for database
      const formattedUsage = storedUsage.map((usage: OpenAIUsageData & { requestId: string }) => ({
        user_id: userId,
        request_id: usage.requestId,
        model: usage.model,
        endpoint: usage.endpoint,
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
        total_tokens: usage.totalTokens,
        response_time_ms: usage.responseTimeMs,
        success: usage.success,
        error_code: usage.errorCode,
        error_message: usage.errorMessage,
        metadata: usage.metadata ? JSON.stringify(usage.metadata) : null
      }));
      
      // Insert usage data into database
      const { error } = await supabase
        .from('openai_api_usage')
        .insert(formattedUsage);
      
      if (error) {
        console.warn('Failed to sync local OpenAI API usage:', error);
        return;
      }
      
      // Clear local storage after successful sync
      localStorage.removeItem(this.localStorageKey);
    } catch (error) {
      console.warn('Error syncing local OpenAI API usage:', error);
    }
  }

  /**
   * Get usage summary for the current user
   */
  public async getUserUsageSummary(days: number = 30): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('openai_api_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate summary statistics
      const totalRequests = data.length;
      const successfulRequests = data.filter(d => d.success).length;
      const totalTokens = data.reduce((sum, d) => sum + (d.total_tokens || 0), 0);
      const totalCost = data.reduce((sum, d) => sum + (d.estimated_cost_usd || 0), 0);
      
      // Group by model
      const usageByModel = data.reduce((acc, d) => {
        const model = d.model;
        if (!acc[model]) {
          acc[model] = {
            requests: 0,
            tokens: 0,
            cost: 0
          };
        }
        acc[model].requests += 1;
        acc[model].tokens += d.total_tokens || 0;
        acc[model].cost += d.estimated_cost_usd || 0;
        return acc;
      }, {} as Record<string, { requests: number; tokens: number; cost: number }>);
      
      // Group by day for trend
      const usageByDay = data.reduce((acc, d) => {
        const day = new Date(d.created_at).toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = {
            requests: 0,
            tokens: 0,
            cost: 0
          };
        }
        acc[day].requests += 1;
        acc[day].tokens += d.total_tokens || 0;
        acc[day].cost += d.estimated_cost_usd || 0;
        return acc;
      }, {} as Record<string, { requests: number; tokens: number; cost: number }>);
      
      return {
        summary: {
          totalRequests,
          successfulRequests,
          successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
          totalTokens,
          totalCost,
          avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
          avgTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0
        },
        byModel: usageByModel,
        byDay: usageByDay,
        recentRequests: data.slice(0, 10)
      };
    } catch (error) {
      console.error('Failed to get OpenAI API usage summary:', error);
      return null;
    }
  }

  /**
   * Get cost optimization recommendations
   */
  public async getCostOptimizationRecommendations(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ai_cost_optimization')
        .select('*')
        .eq('user_id', user.id)
        .order('estimated_savings', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to get cost optimization recommendations:', error);
      return [];
    }
  }
}

export const openaiUsageService = new OpenAIUsageService();