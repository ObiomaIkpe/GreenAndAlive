import { supabase } from './supabaseClient';
import { config } from '../config/environment';

export interface AIUsageMetric {
  model: string;
  requestType: string;
  tokensUsed?: number;
  responseTime?: number;
  success: boolean;
  fallbackUsed: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for tracking AI usage metrics
 * This helps monitor AI performance, costs, and fallback usage
 */
class AIMetricsService {
  private isEnabled: boolean;
  private metricsQueue: AIUsageMetric[] = [];
  private isProcessingQueue: boolean = false;
  private flushInterval: number = 10000; // 10 seconds
  private intervalId: number | null = null;
  private localStorageKey: string = 'ai_metrics_queue';

  constructor() {
    // Enable metrics collection by default in production, can be overridden
    this.isEnabled = config.isProduction || true;
    
    // Start the flush interval
    if (this.isEnabled) {
      this.startFlushInterval();
    }
  }

  /**
   * Track an AI request metric
   */
  public trackRequest(metric: AIUsageMetric): void {
    if (!this.isEnabled) return;
    
    this.metricsQueue.push({
      ...metric,
      model: metric.model || config.ai.model,
    });
    
    // If queue gets too large, flush immediately
    if (this.metricsQueue.length >= 10) {
      this.flushMetrics();
    }
  }

  /**
   * Enable or disable metrics collection
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
   * Start the interval to periodically flush metrics
   */
  private startFlushInterval(): void {
    if (this.intervalId) return;
    
    this.intervalId = window.setInterval(() => {
      this.flushMetrics();
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
   * Flush metrics to the database
   */
  private async flushMetrics(): Promise<void> {
    if (this.isProcessingQueue || this.metricsQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    const metricsToFlush = [...this.metricsQueue];
    this.metricsQueue = [];
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Format metrics for database
        const formattedMetrics = metricsToFlush.map(metric => ({
          user_id: user.id,
          model: metric.model,
          request_type: metric.requestType,
          tokens_used: metric.tokensUsed,
          response_time: metric.responseTime,
          success: metric.success,
          fallback_used: metric.fallbackUsed,
          error_message: metric.errorMessage,
          metadata: metric.metadata ? JSON.stringify(metric.metadata) : null
        }));
        
        // Insert metrics into database
        const { error } = await supabase
          .from('ai_usage_metrics')
          .insert(formattedMetrics);
        
        if (error) {
          console.warn('Failed to save AI metrics:', error);
          // Put metrics back in queue to try again later
          this.metricsQueue = [...metricsToFlush, ...this.metricsQueue];
        }
      } else {
        // Store metrics in localStorage if user is not authenticated
        const storedMetrics = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
        localStorage.setItem(this.localStorageKey, JSON.stringify([...storedMetrics, ...metricsToFlush]));
      }
    } catch (error) {
      console.warn('Error flushing AI metrics:', error);
      // Put metrics back in queue to try again later
      this.metricsQueue = [...metricsToFlush, ...this.metricsQueue];
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Sync metrics from localStorage to database when user logs in
   */
  public async syncLocalMetrics(userId: string): Promise<void> {
    try {
      const storedMetrics = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      if (storedMetrics.length === 0) return;
      
      // Format metrics for database
      const formattedMetrics = storedMetrics.map((metric: AIUsageMetric) => ({
        user_id: userId,
        model: metric.model,
        request_type: metric.requestType,
        tokens_used: metric.tokensUsed,
        response_time: metric.responseTime,
        success: metric.success,
        fallback_used: metric.fallbackUsed,
        error_message: metric.errorMessage,
        metadata: metric.metadata ? JSON.stringify(metric.metadata) : null
      }));
      
      // Insert metrics into database
      const { error } = await supabase
        .from('ai_usage_metrics')
        .insert(formattedMetrics);
      
      if (error) {
        console.warn('Failed to sync local AI metrics:', error);
        return;
      }
      
      // Clear local storage after successful sync
      localStorage.removeItem(this.localStorageKey);
    } catch (error) {
      console.warn('Error syncing local AI metrics:', error);
    }
  }

  /**
   * Get usage metrics for the current user
   */
  public async getUserMetrics(days: number = 30): Promise<any> {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) return null;
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) return null;
      
      // Call the backend API to get metrics
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/ai/metrics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch AI metrics');
      }

      const responseData = await response.json();
      return responseData.metrics.usage;
    } catch (error) {
      console.error('Failed to get user metrics:', error);
      return null;
    }
  }
  
  /**
   * Get cost metrics for the current user
   */
  public async getUserCostMetrics(days: number = 30): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('ai_cost_tracking')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Calculate summary statistics
      const totalCost = data.reduce((sum, m) => sum + parseFloat(m.cost), 0);
      const totalTokens = data.reduce((sum, m) => sum + m.tokens_used, 0);
      
      // Group by model
      const costByModel = data.reduce((acc, m) => {
        acc[m.model] = (acc[m.model] || 0) + parseFloat(m.cost);
        return acc;
      }, {} as Record<string, number>);
      
      // Group by date for trend
      const costByDate = data.reduce((acc, m) => {
        acc[m.date] = (acc[m.date] || 0) + parseFloat(m.cost);
        return acc;
      }, {} as Record<string, number>);
      
      return {
        costs: data,
        summary: {
          totalCost,
          totalTokens,
          costByModel,
          costByDate,
          avgCostPerRequest: data.length > 0 ? totalCost / data.length : 0
        }
      };
    } catch (error) {
      console.error('Failed to get user cost metrics:', error);
      return null;
    }
  }
  
  /**
   * Get model comparison data
   */
  public async getModelComparisons(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ai_model_comparison')
        .select('*');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to get model comparisons:', error);
      return [];
    }
  }
  
  /**
   * Get model performance data
   */
  public async getModelPerformance(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ai_model_performance')
        .select('*');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to get model performance:', error);
      return [];
    }
  }
}

export const aiMetricsService = new AIMetricsService();