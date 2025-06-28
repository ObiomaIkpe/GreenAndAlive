import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { config } from '../config/environment';
import { UtilsService } from './utilsService';
import { authService } from './authService';
import { aiService } from './aiService';

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
      const currentUser = authService.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Build query string
      let queryString = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.implemented !== undefined) params.append('implemented', String(filters.implemented));
        if (filters.dismissed !== undefined) params.append('dismissed', String(filters.dismissed));
        queryString = params.toString() ? `?${params.toString()}` : '';
      }
      
      // Call the backend API to get recommendations
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/ai/recommendations${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load AI recommendations');
      }

      const responseData = await response.json();
      return responseData.recommendations;
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load AI recommendations');
      throw error;
    }
  }

  async generateRecommendations(data: GenerateRecommendationsRequest): Promise<AIRecommendationAPI[]> {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call the backend API to generate recommendations
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recommendations');
      }

      const responseData = await response.json();
      
      notificationService.success(
        'AI Recommendations Generated',
        `Generated ${responseData.recommendations.length} personalized recommendations`
      );
      
      return responseData.recommendations;
    } catch (error) {
      notificationService.error('AI Service Error', 'Failed to generate recommendations');
      throw error;
    }
  }

  async implementRecommendation(id: string, notes?: string): Promise<AIRecommendationAPI> {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call the backend API to implement recommendation
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/ai/recommendations/${id}/implement`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to implement recommendation');
      }

      const responseData = await response.json();
      
      notificationService.success(
        'Recommendation Implemented',
        'Great job on implementing this recommendation!'
      );
      
      return responseData.recommendation;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to mark recommendation as implemented');
      throw error;
    }
  }

  async dismissRecommendation(id: string): Promise<AIRecommendationAPI> {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call the backend API to dismiss recommendation
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/ai/recommendations/${id}/dismiss`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to dismiss recommendation');
      }

      const responseData = await response.json();
      
      notificationService.info('Recommendation Dismissed', 'Recommendation has been dismissed');
      
      return responseData.recommendation;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to dismiss recommendation');
      throw error;
    }
  }

  async predictEmissions(data: PredictEmissionsRequest): Promise<EmissionPrediction> {
    try {
      // In a real implementation, this would call OpenAI API
      // Try to use the real AI service first
      try {
        const prediction = await aiService.predictCarbonEmissions(data);
        
        notificationService.success(
          'Prediction Generated',
          `Predicted emissions: ${prediction.predictedEmissions.toFixed(1)} tons CO₂`
        );
        
        return prediction;
      } catch (error) {
        console.warn('AI prediction failed, using fallback:', error);
        
        // Fallback to mock prediction
        const avgEmissions = data.monthly_emissions.reduce((a, b) => a + b, 0) / data.monthly_emissions.length;
        const prediction: EmissionPrediction = {
          predictedEmissions: Math.max(avgEmissions * 0.95, 20),
          trend: 'decreasing',
          factors: ['Historical trends', 'Seasonal patterns', 'Energy efficiency improvements'],
          confidence: 85,
          timeframe: '3 months',
        };
        
        notificationService.warning(
          'Using Fallback Prediction',
          `AI service unavailable. Using statistical prediction instead.`
        );
        
        return prediction;
      }
      
    } catch (error) {
      notificationService.error('AI Service Error', 'Failed to predict emissions');
      throw error;
    }
  }

  async analyzeBehavior(data: AnalyzeBehaviorRequest): Promise<BehaviorAnalysis> {
    try {
      // In a real implementation, this would call OpenAI API
      // Try to use the real AI service first
      try {
        const analysis = await aiService.analyzeBehavior(data);
        
        notificationService.success(
          'Behavior Analysis Complete',
          `Your behavior score: ${analysis.behavior_score}/100`
        );
        
        return analysis;
      } catch (error) {
        console.warn('AI behavior analysis failed, using fallback:', error);
        
        // Fallback to mock analysis
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
        
        notificationService.warning(
          'Using Fallback Analysis',
          `AI service unavailable. Using pre-generated behavior analysis.`
        );
        
        return analysis;
      }
      
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