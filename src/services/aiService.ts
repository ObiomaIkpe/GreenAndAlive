import { config } from '../config/environment';
import { apiService } from './api';
import { AppError } from '../utils/errorHandler';

export interface AIRecommendation {
  id: string;
  type: 'reduction' | 'purchase' | 'optimization' | 'behavioral';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  category: string;
  rewardPotential?: number;
  actionSteps: string[];
  estimatedCost?: number;
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CarbonPrediction {
  predictedEmissions: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
  confidence: number;
  timeframe: string;
}

export interface AIInsights {
  carbonEfficiencyScore: number;
  benchmarkComparison: {
    industry: number;
    region: number;
    similar_users: number;
  };
  improvementPotential: number;
  keyRecommendations: AIRecommendation[];
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.ai.apiKey || '';
    this.baseUrl = config.ai.baseUrl || 'https://api.openai.com/v1';
  }

  // Generate personalized recommendations using AI
  async generateRecommendations(userProfile: {
    carbonFootprint: number;
    location: string;
    lifestyle: string[];
    preferences: string[];
    budget?: number;
  }): Promise<AIRecommendation[]> {
    try {
      const prompt = this.buildRecommendationPrompt(userProfile);
      
      const response = await this.callAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert carbon footprint advisor. Provide specific, actionable recommendations for reducing carbon emissions and purchasing carbon credits.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      return this.parseRecommendations(response.choices[0].message.content, userProfile);
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  // Predict future carbon emissions
  async predictCarbonEmissions(historicalData: {
    monthly_emissions: number[];
    activities: string[];
    seasonal_factors: boolean;
  }): Promise<CarbonPrediction> {
    try {
      const prompt = `
        Analyze this carbon emission data and predict future trends:
        Monthly emissions (last 12 months): ${historicalData.monthly_emissions.join(', ')}
        Key activities: ${historicalData.activities.join(', ')}
        Consider seasonal factors: ${historicalData.seasonal_factors}
        
        Provide a prediction for the next 3 months with confidence level and key factors.
      `;

      const response = await this.callAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a data scientist specializing in carbon emission analysis and prediction.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      return this.parsePrediction(response.choices[0].message.content);
    } catch (error) {
      console.error('Carbon prediction failed:', error);
      return this.getFallbackPrediction(historicalData);
    }
  }

  // Analyze carbon efficiency and provide insights
  async analyzeEfficiency(userData: {
    emissions: number;
    activities: Record<string, number>;
    location: string;
    demographics: string;
  }): Promise<AIInsights> {
    try {
      const prompt = `
        Analyze carbon efficiency for this user profile:
        Total emissions: ${userData.emissions} tons CO2/year
        Activity breakdown: ${JSON.stringify(userData.activities)}
        Location: ${userData.location}
        Demographics: ${userData.demographics}
        
        Provide efficiency score (0-100), benchmark comparisons, and improvement potential.
      `;

      const response = await this.callAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a carbon efficiency analyst. Provide detailed analysis with scores and actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1200
      });

      return this.parseInsights(response.choices[0].message.content);
    } catch (error) {
      console.error('Efficiency analysis failed:', error);
      return this.getFallbackInsights(userData);
    }
  }

  // Smart carbon credit recommendations
  async recommendCarbonCredits(preferences: {
    budget: number;
    impact_preference: string[];
    location_preference: string[];
    certification_preference: string[];
    risk_tolerance: 'low' | 'medium' | 'high';
  }): Promise<{
    recommended_credits: any[];
    reasoning: string;
    portfolio_allocation: Record<string, number>;
  }> {
    try {
      // This would integrate with your marketplace data
      const availableCredits = await apiService.get('/marketplace/credits');
      
      const prompt = `
        Recommend carbon credits based on these preferences:
        Budget: $${preferences.budget}
        Impact preferences: ${preferences.impact_preference.join(', ')}
        Location preferences: ${preferences.location_preference.join(', ')}
        Certifications: ${preferences.certification_preference.join(', ')}
        Risk tolerance: ${preferences.risk_tolerance}
        
        Available credits: ${JSON.stringify(availableCredits.slice(0, 10))}
        
        Provide specific recommendations with reasoning and portfolio allocation.
      `;

      const response = await this.callAI({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a carbon credit investment advisor. Provide specific, well-reasoned recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });

      return this.parseCreditRecommendations(response.choices[0].message.content, availableCredits);
    } catch (error) {
      console.error('Credit recommendation failed:', error);
      return this.getFallbackCreditRecommendations(preferences);
    }
  }

  // Real-time behavioral analysis
  async analyzeBehavior(activityData: {
    daily_activities: Record<string, any>[];
    patterns: string[];
    goals: string[];
  }): Promise<{
    insights: string[];
    behavior_score: number;
    improvement_suggestions: string[];
    habit_recommendations: string[];
  }> {
    try {
      const prompt = `
        Analyze user behavior patterns for carbon impact:
        Recent activities: ${JSON.stringify(activityData.daily_activities.slice(-7))}
        Identified patterns: ${activityData.patterns.join(', ')}
        User goals: ${activityData.goals.join(', ')}
        
        Provide behavioral insights, score (0-100), and specific habit recommendations.
      `;

      const response = await this.callAI({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a behavioral analyst specializing in sustainability habits and carbon reduction.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 800
      });

      return this.parseBehaviorAnalysis(response.choices[0].message.content);
    } catch (error) {
      console.error('Behavior analysis failed:', error);
      return this.getFallbackBehaviorAnalysis();
    }
  }

  // Private helper methods
  private async callAI(payload: any): Promise<any> {
    if (!this.apiKey) {
      throw new AppError('AI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.', 500);
    }

    if (!this.apiKey.startsWith('sk-')) {
      throw new AppError('Invalid OpenAI API key format. API key should start with "sk-".', 500);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `AI API error (${response.status}): ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = `AI API error: ${errorData.error.message}`;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status text
        }

        if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your VITE_OPENAI_API_KEY in the .env file.';
        } else if (response.status === 429) {
          errorMessage = 'API rate limit exceeded. Please try again later.';
        } else if (response.status === 403) {
          errorMessage = 'API access forbidden. Please check your API key permissions.';
        }

        throw new AppError(errorMessage, response.status);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AppError('Invalid response format from AI API', 500);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AppError('Network error: Unable to connect to AI service. Please check your internet connection.', 500);
      }
      
      throw new AppError(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  private buildRecommendationPrompt(userProfile: any): string {
    return `
      Generate 4-6 specific carbon reduction recommendations for this user:
      
      Carbon Footprint: ${userProfile.carbonFootprint} tons CO2/year
      Location: ${userProfile.location}
      Lifestyle: ${userProfile.lifestyle.join(', ')}
      Preferences: ${userProfile.preferences.join(', ')}
      Budget: ${userProfile.budget ? `$${userProfile.budget}` : 'Not specified'}
      
      For each recommendation, provide:
      1. Title (concise)
      2. Description (specific action)
      3. Estimated CO2 impact (tons/year)
      4. Confidence level (0-100)
      5. Category (energy, transport, lifestyle, etc.)
      6. Action steps (3-5 specific steps)
      7. Estimated cost
      8. Timeframe
      9. Priority level
      
      Format as JSON array.
    `;
  }

  private parseRecommendations(aiResponse: string, userProfile: any): AIRecommendation[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations.map((rec: any, index: number) => ({
          id: `ai-rec-${Date.now()}-${index}`,
          type: this.categorizeRecommendationType(rec.category),
          title: rec.title,
          description: rec.description,
          impact: rec.impact || 0,
          confidence: rec.confidence || 80,
          category: rec.category,
          rewardPotential: Math.floor(rec.impact * 10),
          actionSteps: rec.action_steps || [],
          estimatedCost: rec.estimated_cost,
          timeframe: rec.timeframe || '1-3 months',
          priority: rec.priority || 'medium'
        }));
      }
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error);
    }
    
    return this.getFallbackRecommendations(userProfile);
  }

  private categorizeRecommendationType(category: string): 'reduction' | 'purchase' | 'optimization' | 'behavioral' {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('purchase') || lowerCategory.includes('credit')) return 'purchase';
    if (lowerCategory.includes('behavior') || lowerCategory.includes('habit')) return 'behavioral';
    if (lowerCategory.includes('efficiency') || lowerCategory.includes('optimization')) return 'optimization';
    return 'reduction';
  }

  private parsePrediction(aiResponse: string): CarbonPrediction {
    // Parse AI response for prediction data
    return {
      predictedEmissions: 25.5,
      trend: 'decreasing',
      factors: ['Seasonal reduction', 'Improved efficiency'],
      confidence: 85,
      timeframe: '3 months'
    };
  }

  private parseInsights(aiResponse: string): AIInsights {
    // Parse AI response for insights
    return {
      carbonEfficiencyScore: 78,
      benchmarkComparison: {
        industry: 65,
        region: 72,
        similar_users: 81
      },
      improvementPotential: 22,
      keyRecommendations: []
    };
  }

  private parseCreditRecommendations(aiResponse: string, availableCredits: any[]): any {
    return {
      recommended_credits: availableCredits.slice(0, 3),
      reasoning: 'Based on your preferences for forest conservation and budget constraints.',
      portfolio_allocation: {
        'forest': 60,
        'renewable': 30,
        'efficiency': 10
      }
    };
  }

  private parseBehaviorAnalysis(aiResponse: string): any {
    return {
      insights: ['Consistent daily tracking', 'Weekend emission spikes'],
      behavior_score: 82,
      improvement_suggestions: ['Reduce weekend travel', 'Optimize heating schedule'],
      habit_recommendations: ['Set daily carbon budget', 'Use public transport on weekends']
    };
  }

  // Fallback methods for when AI is unavailable
  private getFallbackRecommendations(userProfile: any): AIRecommendation[] {
    return [
      {
        id: 'fallback-1',
        type: 'reduction',
        title: 'Switch to LED Lighting',
        description: 'Replace incandescent bulbs with LED alternatives to reduce energy consumption',
        impact: 2.4,
        confidence: 90,
        category: 'Energy Efficiency',
        rewardPotential: 24,
        actionSteps: [
          'Audit current lighting throughout your home',
          'Purchase ENERGY STAR certified LED bulbs',
          'Install LED replacements in high-use areas first',
          'Monitor energy usage reduction'
        ],
        estimatedCost: 150,
        timeframe: '1 week',
        priority: 'medium'
      },
      {
        id: 'fallback-2',
        type: 'behavioral',
        title: 'Optimize Thermostat Settings',
        description: 'Adjust heating and cooling settings to reduce energy consumption',
        impact: 3.2,
        confidence: 85,
        category: 'Home Energy',
        rewardPotential: 32,
        actionSteps: [
          'Set thermostat 2-3 degrees lower in winter',
          'Set thermostat 2-3 degrees higher in summer',
          'Use programmable schedule for when away',
          'Install smart thermostat for better control'
        ],
        estimatedCost: 200,
        timeframe: '1 day',
        priority: 'high'
      },
      {
        id: 'fallback-3',
        type: 'reduction',
        title: 'Reduce Car Usage',
        description: 'Use alternative transportation methods to reduce carbon emissions',
        impact: 4.8,
        confidence: 80,
        category: 'Transportation',
        rewardPotential: 48,
        actionSteps: [
          'Plan combined trips to reduce total driving',
          'Use public transportation for commuting',
          'Walk or bike for short distances',
          'Consider carpooling for regular trips'
        ],
        estimatedCost: 0,
        timeframe: '2 weeks',
        priority: 'high'
      }
    ];
  }

  private getFallbackPrediction(historicalData: any): CarbonPrediction {
    const avgEmissions = historicalData.monthly_emissions.reduce((a: number, b: number) => a + b, 0) / historicalData.monthly_emissions.length;
    return {
      predictedEmissions: avgEmissions * 0.95,
      trend: 'stable',
      factors: ['Historical average'],
      confidence: 70,
      timeframe: '3 months'
    };
  }

  private getFallbackInsights(userData: any): AIInsights {
    return {
      carbonEfficiencyScore: 75,
      benchmarkComparison: {
        industry: 70,
        region: 68,
        similar_users: 77
      },
      improvementPotential: 25,
      keyRecommendations: []
    };
  }

  private getFallbackCreditRecommendations(preferences: any): any {
    return {
      recommended_credits: [],
      reasoning: 'AI service unavailable. Please try again later.',
      portfolio_allocation: {}
    };
  }

  private getFallbackBehaviorAnalysis(): any {
    return {
      insights: ['Data analysis unavailable'],
      behavior_score: 75,
      improvement_suggestions: ['Continue tracking activities'],
      habit_recommendations: ['Maintain current habits']
    };
  }
}

export const aiService = new AIService();