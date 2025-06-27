import { apiService } from './api';
import { notificationService } from './notificationService';

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
  async generateRecommendations(data: GenerateRecommendationsRequest): Promise<AIRecommendationAPI[]> {
    try {
      const recommendations = await apiService.post<AIRecommendationAPI[]>('/ai/recommendations', data);
      
      notificationService.success(
        'AI Recommendations Generated',
        `Generated ${recommendations.length} personalized recommendations`
      );
      
      return recommendations;
    } catch (error) {
      notificationService.error('AI Service Error', 'Failed to generate recommendations');
      throw error;
    }
  }

  async getRecommendations(filters?: {
    type?: string;
    implemented?: boolean;
    dismissed?: boolean;
  }): Promise<AIRecommendationAPI[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const url = `/ai/recommendations${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiService.get<AIRecommendationAPI[]>(url);
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load AI recommendations');
      throw error;
    }
  }

  async implementRecommendation(id: string, notes?: string): Promise<AIRecommendationAPI> {
    try {
      const recommendation = await apiService.patch<AIRecommendationAPI>(
        `/ai/recommendations/${id}/implement`,
        { notes }
      );
      
      notificationService.success(
        'Recommendation Implemented',
        'Great job on implementing this recommendation!'
      );
      
      return recommendation;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to mark recommendation as implemented');
      throw error;
    }
  }

  async dismissRecommendation(id: string): Promise<AIRecommendationAPI> {
    try {
      const recommendation = await apiService.patch<AIRecommendationAPI>(
        `/ai/recommendations/${id}/dismiss`,
        {}
      );
      
      notificationService.info('Recommendation Dismissed', 'Recommendation has been dismissed');
      
      return recommendation;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to dismiss recommendation');
      throw error;
    }
  }

  async predictEmissions(data: PredictEmissionsRequest): Promise<EmissionPrediction> {
    try {
      const prediction = await apiService.post<EmissionPrediction>('/ai/predict-emissions', data);
      
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
      const analysis = await apiService.post<BehaviorAnalysis>('/ai/analyze-behavior', data);
      
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
}

export const aiServiceAPI = new AIServiceAPI();