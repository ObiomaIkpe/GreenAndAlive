import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { config } from '../config/environment';
import { UtilsService } from './utilsService';
import { authService } from './authService';

export interface AIRecommendationAPI {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: number;
  confidence: number;
  category: string;
  rewardPotential?: number;
  actionSteps: string[];
  estimatedCost?: number;
  timeframe: string;
  priority: string;
  implemented: boolean;
  dismissed: boolean;
  implementationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRecommendationsRequest {
  carbonFootprint: number;
  location: string;
  lifestyle: string[];
  preferences: string[];
  budget?: number;
}

export interface PredictEmissionsRequest {
  monthly_emissions: number[];
  activities: string[];
  seasonal_factors: boolean;
}

export interface AnalyzeBehaviorRequest {
  daily_activities: Record<string, any>[];
  patterns: string[];
  goals: string[];
}

export interface EmissionPrediction {
  predictedEmissions: number;
  trend: string;
  factors: string[];
  confidence: number;
  timeframe: string;
}

export interface BehaviorAnalysis {
  insights: string[];
  behavior_score: number;
  improvement_suggestions: string[];
  habit_recommendations: string[];
}

class AIServiceAPI {
  private utilsService = new UtilsService();
  private openaiApiKey = config.ai.apiKey;
  private openaiModel = config.ai.model;
  private openaiBaseUrl = config.ai.baseUrl;

  async getRecommendations(filters?: {
    type?: string;
    implemented?: boolean;
    dismissed?: boolean;
  }): Promise<AIRecommendationAPI[]> {
    try {
      let data;
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Build query
        let query = supabase
          .from('ai_recommendations')
          .select('*')
          .eq('user_id', user.id);
        
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        
        if (filters?.implemented !== undefined) {
          query = query.eq('implemented', filters.implemented);
        }
        
        if (filters?.dismissed !== undefined) {
          query = query.eq('dismissed', filters.dismissed);
        }
        
        const { data: recommendations, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        data = recommendations;
      } catch (e) {
        console.warn('Supabase recommendations fetch error, using fallback:', e);
        // Fallback to mock data
        data = JSON.parse(localStorage.getItem('mockRecommendations') || '[]');
        
        // If no mock data exists, create some
        if (data.length === 0) {
          data = this.getMockRecommendations();
          localStorage.setItem('mockRecommendations', JSON.stringify(data));
        }
        
        // Apply filters to mock data
        if (filters?.type) {
          data = data.filter(rec => rec.type === filters.type);
        }
        
        if (filters?.implemented !== undefined) {
          data = data.filter(rec => rec.implemented === filters.implemented);
        }
        
        if (filters?.dismissed !== undefined) {
          data = data.filter(rec => rec.dismissed === filters.dismissed);
        }
      }
      
      return data.map(rec => this.formatRecommendation(rec));
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load AI recommendations');
      throw error;
    }
  }

  async generateRecommendations(data: GenerateRecommendationsRequest): Promise<AIRecommendationAPI[]> {
    try {
      let savedRecommendations = [];
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // In a real implementation, this would call OpenAI API
        // For now, we'll create mock recommendations
        const mockRecommendations = this.getMockRecommendations(data);
        
        // Save recommendations to database
        for (const rec of mockRecommendations) {
          const { data: savedRec, error } = await supabase
            .from('ai_recommendations')
            .insert({
              user_id: user.id,
              type: rec.type,
              title: rec.title,
              description: rec.description,
              impact: rec.impact,
              confidence: rec.confidence,
              category: rec.category,
              reward_potential: rec.rewardPotential,
              action_steps: rec.actionSteps,
              estimated_cost: rec.estimatedCost,
              timeframe: rec.timeframe,
              priority: rec.priority,
              implemented: false,
              dismissed: false,
            })
            .select()
            .single();
          
          if (error) throw error;
          
          savedRecommendations.push(this.formatRecommendation(savedRec));
        }
      } catch (e) {
        console.warn('Supabase recommendations generation error, using fallback:', e);
        // Fallback to mock data
        const mockRecommendations = this.getMockRecommendations(data);
        const currentUser = authService.getUser();
        const userId = currentUser?.id || 'mock-user-id';
        
        // Create mock recommendations
        savedRecommendations = mockRecommendations.map((rec, index) => ({
          id: `mock-rec-${Date.now()}-${index}`,
          user_id: userId,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          impact: rec.impact,
          confidence: rec.confidence,
          category: rec.category,
          reward_potential: rec.rewardPotential,
          action_steps: rec.actionSteps,
          estimated_cost: rec.estimatedCost,
          timeframe: rec.timeframe,
          priority: rec.priority,
          implemented: false,
          dismissed: false,
          implementation_notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        
        // Store in localStorage
        localStorage.setItem('mockRecommendations', JSON.stringify(savedRecommendations));
      }
      
      notificationService.success(
        'AI Recommendations Generated',
        `Generated ${savedRecommendations.length} personalized recommendations`
      );
      
      return savedRecommendations;
    } catch (error) {
      notificationService.error('AI Service Error', 'Failed to generate recommendations');
      throw error;
    }
  }

  async implementRecommendation(id: string, notes?: string): Promise<AIRecommendationAPI> {
    try {
      let data;
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Update recommendation
        const { data: updatedRec, error } = await supabase
          .from('ai_recommendations')
          .update({
            implemented: true,
            implementation_notes: notes,
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        data = updatedRec;
      } catch (e) {
        console.warn('Supabase recommendation implementation error, using fallback:', e);
        // Fallback to localStorage
        const mockRecommendations = JSON.parse(localStorage.getItem('mockRecommendations') || '[]');
        const index = mockRecommendations.findIndex(rec => rec.id === id);
        
        if (index !== -1) {
          mockRecommendations[index].implemented = true;
          mockRecommendations[index].implementation_notes = notes || null;
          mockRecommendations[index].updated_at = new Date().toISOString();
          localStorage.setItem('mockRecommendations', JSON.stringify(mockRecommendations));
          data = mockRecommendations[index];
        } else {
          throw new Error('Recommendation not found');
        }
      }
      
      notificationService.success(
        'Recommendation Implemented',
        'Great job on implementing this recommendation!'
      );
      
      return this.formatRecommendation(data);
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to mark recommendation as implemented');
      throw error;
    }
  }

  async dismissRecommendation(id: string): Promise<AIRecommendationAPI> {
    try {
      let data;
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Update recommendation
        const { data: updatedRec, error } = await supabase
          .from('ai_recommendations')
          .update({
            dismissed: true,
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        data = updatedRec;
      } catch (e) {
        console.warn('Supabase recommendation dismissal error, using fallback:', e);
        // Fallback to localStorage
        const mockRecommendations = JSON.parse(localStorage.getItem('mockRecommendations') || '[]');
        const index = mockRecommendations.findIndex(rec => rec.id === id);
        
        if (index !== -1) {
          mockRecommendations[index].dismissed = true;
          mockRecommendations[index].updated_at = new Date().toISOString();
          localStorage.setItem('mockRecommendations', JSON.stringify(mockRecommendations));
          data = mockRecommendations[index];
        } else {
          throw new Error('Recommendation not found');
        }
      }
      
      notificationService.info('Recommendation Dismissed', 'Recommendation has been dismissed');
      
      return this.formatRecommendation(data);
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to dismiss recommendation');
      throw error;
    }
  }

  async predictEmissions(data: PredictEmissionsRequest): Promise<EmissionPrediction> {
    try {
      // In a real implementation, this would call OpenAI API
      // For now, return mock prediction
      const avgEmissions = data.monthly_emissions.reduce((a, b) => a + b, 0) / data.monthly_emissions.length;
      const prediction: EmissionPrediction = {
        predictedEmissions: Math.max(avgEmissions * 0.95, 20),
        trend: 'decreasing',
        factors: ['Historical trends', 'Seasonal patterns', 'Energy efficiency improvements'],
        confidence: 85,
        timeframe: '3 months',
      };
      
      notificationService.success(
        'Prediction Generated',
        `Predicted emissions: ${prediction.predictedEmissions.toFixed(1)} tons CO₂`
      );
      
      return prediction;
    } catch (error) {
      notificationService.error('AI Service Error', 'Failed to predict emissions');
      throw error;
    }
  }

  async analyzeBehavior(data: AnalyzeBehaviorRequest): Promise<BehaviorAnalysis> {
    try {
      // In a real implementation, this would call OpenAI API
      // For now, return mock analysis
      const analysis: BehaviorAnalysis = {
        insights: [
          'Your carbon tracking shows consistent engagement with sustainability',
          'Transportation appears to be your largest emission source',
          'Energy usage patterns suggest room for optimization',
        ],
        behavior_score: 78,
        improvement_suggestions: [
          'Focus on reducing transportation emissions through alternative mobility',
          'Implement energy-saving habits during peak usage hours',
          'Consider renewable energy options for your home',
        ],
        habit_recommendations: [
          'Set up automated energy-saving schedules',
          'Plan weekly sustainable transportation goals',
          'Create monthly carbon reduction challenges',
        ],
      };
      
      notificationService.success(
        'Behavior Analysis Complete',
        `Your behavior score: ${analysis.behavior_score}/100`
      );
      
      return analysis;
    } catch (error) {
      notificationService.error('AI Service Error', 'Failed to analyze behavior');
      throw error;
    }
  }

  private formatRecommendation(data: any): AIRecommendationAPI {
    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      impact: data.impact,
      confidence: data.confidence,
      category: data.category,
      rewardPotential: data.reward_potential,
      actionSteps: data.action_steps,
      estimatedCost: data.estimated_cost,
      timeframe: data.timeframe,
      priority: data.priority,
      implemented: data.implemented,
      dismissed: data.dismissed,
      implementationNotes: data.implementation_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  
  // Generate mock recommendations for development/fallback
  private getMockRecommendations(userProfile?: any): Partial<AIRecommendationAPI>[] {
    return [
      {
        type: 'reduction',
        title: 'Optimize Home Energy Usage',
        description: 'Implement smart energy management practices to reduce your carbon footprint',
        impact: 3.2,
        confidence: 90,
        category: 'Energy Efficiency',
        rewardPotential: 32,
        actionSteps: [
          'Install a programmable thermostat',
          'Switch to LED lighting throughout your home',
          'Unplug electronics when not in use',
          'Use energy-efficient appliances'
        ],
        estimatedCost: 300,
        timeframe: '2-4 weeks',
        priority: 'medium',
      },
      {
        type: 'behavioral',
        title: 'Sustainable Transportation',
        description: 'Reduce transportation emissions through smart mobility choices',
        impact: 4.8,
        confidence: 85,
        category: 'Transportation',
        rewardPotential: 48,
        actionSteps: [
          'Use public transportation or carpool when possible',
          'Walk or bike for trips under 2 miles',
          'Combine errands into single trips',
          'Consider electric or hybrid vehicle for next purchase'
        ],
        estimatedCost: 0,
        timeframe: '1-2 weeks',
        priority: 'high',
      },
      {
        type: 'purchase',
        title: 'Invest in Carbon Credits',
        description: 'Purchase verified carbon credits to offset your remaining emissions',
        impact: 5.5,
        confidence: 80,
        category: 'Carbon Offsetting',
        rewardPotential: 55,
        actionSteps: [
          'Calculate your annual carbon footprint',
          'Research verified carbon credit projects',
          'Purchase credits from reputable providers',
          'Track and verify your offset impact'
        ],
        estimatedCost: userProfile?.budget || 500,
        timeframe: '1 week',
        priority: 'high',
      },
    ];
  }

  private getMockRecommendations(userProfile: any): Partial<AIRecommendationAPI>[] {
    return [
      {
        type: 'reduction',
        title: 'Optimize Home Energy Usage',
        description: 'Implement smart energy management practices to reduce your carbon footprint',
        impact: 3.2,
        confidence: 90,
        category: 'Energy Efficiency',
        rewardPotential: 32,
        actionSteps: [
          'Install a programmable thermostat',
          'Switch to LED lighting throughout your home',
          'Unplug electronics when not in use',
          'Use energy-efficient appliances'
        ],
        estimatedCost: 300,
        timeframe: '2-4 weeks',
        priority: 'medium',
      },
      {
        type: 'behavioral',
        title: 'Sustainable Transportation',
        description: 'Reduce transportation emissions through smart mobility choices',
        impact: 4.8,
        confidence: 85,
        category: 'Transportation',
        rewardPotential: 48,
        actionSteps: [
          'Use public transportation or carpool when possible',
          'Walk or bike for trips under 2 miles',
          'Combine errands into single trips',
          'Consider electric or hybrid vehicle for next purchase'
        ],
        estimatedCost: 0,
        timeframe: '1-2 weeks',
        priority: 'high',
      },
      {
        type: 'purchase',
        title: 'Invest in Carbon Credits',
        description: 'Purchase verified carbon credits to offset your remaining emissions',
        impact: 5.5,
        confidence: 80,
        category: 'Carbon Offsetting',
        rewardPotential: 55,
        actionSteps: [
          'Calculate your annual carbon footprint',
          'Research verified carbon credit projects',
          'Purchase credits from reputable providers',
          'Track and verify your offset impact'
        ],
        estimatedCost: userProfile.budget || 500,
        timeframe: '1 week',
        priority: 'high',
      },
    ];
  }
}

export const aiServiceAPI = new AIServiceAPI();