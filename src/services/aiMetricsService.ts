import { supabase } from './supabaseClient';
import { config } from '../config/environment';
import { authService } from './authService';

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
  private localStorageKey: string = 'carbonai_ai_metrics_queue';
  private apiKey: string = config.ai.apiKey;

  constructor() {
    // Enable metrics collection by default in production, can be overridden
    this.isEnabled = config.isProduction || true;

    // Check if API key is configured
    if (this.apiKey) {
      console.log('AI metrics tracking enabled with API key');
    } else {
      console.warn('AI metrics tracking enabled but no API key configured');
    }
    
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
    
    // Add API key status to metadata
    const enhancedMetadata = {
      ...metric.metadata,
      apiKeyConfigured: !!this.apiKey,
      apiKeyValid: this.apiKey && this.apiKey.startsWith('sk-'),
      apiKeyLength: this.apiKey ? this.apiKey.length : 0
    };
    
    this.metricsQueue.push({
      ...metric,
      model: metric.model || config.ai.model,
      metadata: enhancedMetadata
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
        const formattedMetrics = metricsToFlush.map(metric => {
          // Extract token counts if available in metadata
          const promptTokens = metric.metadata?.usage?.prompt_tokens;
          const completionTokens = metric.metadata?.usage?.completion_tokens;
          const totalTokens = metric.tokensUsed || metric.metadata?.usage?.total_tokens;
          
          return {
            user_id: user.id,
            model: metric.model,
            request_type: metric.requestType,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
            response_time: metric.responseTime,
            success: metric.success,
            fallback_used: metric.fallbackUsed,
            error_message: metric.errorMessage,
            api_version: 'v1',
            client_info: JSON.stringify({
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            }),
            metadata: metric.metadata ? JSON.stringify(metric.metadata) : null
          };
        });
        
        // Insert metrics into database
        const { error } = await supabase
          .from('ai_usage_metrics_enhanced')
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
        prompt_tokens: metric.metadata?.usage?.prompt_tokens,
        completion_tokens: metric.metadata?.usage?.completion_tokens,
        total_tokens: metric.tokensUsed || metric.metadata?.usage?.total_tokens,
        response_time: metric.responseTime,
        success: metric.success,
        fallback_used: metric.fallbackUsed,
        error_message: metric.errorMessage,
        api_version: 'v1',
        client_info: JSON.stringify({
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }),
        metadata: metric.metadata ? JSON.stringify(metric.metadata) : null
      }));
      
      // Insert metrics into database
      const { error } = await supabase
        .from('ai_usage_metrics_enhanced')
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
      if (!currentUser) {
        console.warn('No authenticated user found for metrics');
        return null;
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        console.warn('No auth token found for metrics API call');
        return null;
      }
      
      // Call the backend API to get metrics
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/ai/metrics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch AI metrics');
        console.error('API error fetching metrics:', errorData);
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
      if (!user) {
        console.warn('No authenticated user found for cost metrics');
        return null;
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('ai_cost_tracking')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      console.log(`Retrieved ${data.length} cost metrics records`);
      
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
        .from('ai_model_performance_metrics')
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
        .from('ai_model_performance_metrics')
        .select('*');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to get model performance:', error);
      return [];
    }
  }
  
  /**
   * Get cost optimization suggestions for the current user
   */
  public async getCostOptimizationSuggestions(): Promise<any> {
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
      console.error('Failed to get cost optimization suggestions:', error);
      return [];
    }
  }
  
  /**
   * Update API key status
   */
  public updateApiKeyStatus(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('AI metrics service updated with new API key status');
  }
}

export const aiMetricsService = new AIMetricsService();