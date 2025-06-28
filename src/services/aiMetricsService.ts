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
        const storedMetrics = JSON.parse(localStorage.getItem('ai_metrics_queue') || '[]');
        localStorage.setItem('ai_metrics_queue', JSON.stringify([...storedMetrics, ...metricsToFlush]));
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
   * Get usage metrics for the current user
   */
  public async getUserMetrics(days: number = 30): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('ai_usage_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate summary statistics
      const totalRequests = data.length;
      const successfulRequests = data.filter(m => m.success).length;
      const fallbackUsage = data.filter(m => m.fallback_used).length;
      const totalTokens = data.reduce((sum, m) => sum + (m.tokens_used || 0), 0);
      const avgResponseTime = data.length > 0 
        ? data.reduce((sum, m) => sum + (m.response_time || 0), 0) / data.length 
        : 0;
      
      // Group by request type
      const requestTypes = data.reduce((acc, m) => {
        acc[m.request_type] = (acc[m.request_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        metrics: data,
        summary: {
          totalRequests,
          successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
          fallbackRate: totalRequests > 0 ? (fallbackUsage / totalRequests) * 100 : 0,
          totalTokens,
          avgResponseTime,
          requestTypes
        }
      };
    } catch (error) {
      console.error('Failed to get user metrics:', error);
      return null;
    }
  }
}

export const aiMetricsService = new AIMetricsService();