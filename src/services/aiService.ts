import { config } from '../config/environment';
import { apiService } from './api';
import { AppError } from '../utils/errorHandler';
import { notificationService } from './notificationService';

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
  private model: string;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // 1 second between requests
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false; 
  private fallbackMode: boolean = false;
  private lastErrorMessage: string = '';
  private apiKeyValid: boolean = false;

  constructor() {
    this.apiKey = config.ai.apiKey || '';
    this.baseUrl = config.ai.baseUrl || 'https://api.openai.com/v1';
    this.model = config.ai.model || 'gpt-3.5-turbo';
    
    // Validate API key format
    if (!this.apiKey) {
      console.warn('OpenAI API key not properly configured, enabling fallback mode');
      this.lastErrorMessage = 'OpenAI API key not properly configured';
      this.fallbackMode = true;
    } else if (this.apiKey.startsWith('sk-')) {
      this.apiKeyValid = true;
      console.log('OpenAI API key format appears valid');
    } else {
      console.warn('OpenAI API key has invalid format, enabling fallback mode');
      this.lastErrorMessage = 'Invalid OpenAI API key format';
      this.fallbackMode = true;
    }
  }

  // Rate limiting wrapper for AI calls
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // If we're in fallback mode and the function isn't a fallback function itself,
      // reject immediately to avoid unnecessary processing
      if (this.fallbackMode && !requestFn.toString().includes('getFallback')) {
        console.log('In fallback mode, skipping API request queue');
        reject(new Error(this.lastErrorMessage || 'AI service in fallback mode'));
        return;
      }
      
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        await this.delay(waitTime);
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate personalized recommendations using AI
  async generateRecommendations(userProfile: {
    carbonFootprint: number;
    location: string;
    lifestyle: string[];
    preferences: string[];
    budget?: number;
  }): Promise<AIRecommendation[]> {
    // If we're already in fallback mode, don't even try the API
    if (this.fallbackMode || !this.apiKeyValid) {
      console.warn('OpenAI API key not configured or in fallback mode, using fallback recommendations for user profile:', userProfile);
      return this.getFallbackRecommendations(userProfile);
    }
    
    try {
      return await this.queueRequest(async () => {
        try {
          if (!this.apiKey) {
            console.warn('OpenAI API key not configured, using fallback recommendations for user profile:', userProfile);
            this.lastErrorMessage = 'OpenAI API key not configured';
            this.fallbackMode = true;
            return this.getFallbackRecommendations(userProfile);
          }

          const prompt = this.buildRecommendationPrompt(userProfile);
          
          const response = await this.callAI({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert carbon footprint advisor. Provide specific, actionable recommendations for reducing carbon emissions and purchasing carbon credits. Always respond with valid JSON format.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1200
          });

          return this.parseRecommendations(response.choices[0].message.content, userProfile);
        } catch (error) {
          console.error('AI recommendation generation failed:', error);
          // Enable fallback mode for future requests
          this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error generating recommendations';
          this.fallbackMode = true;
          notificationService.warning(
            'Using Fallback Recommendations',
            'AI service is currently unavailable. Using pre-generated recommendations instead.'
          );
          return this.getFallbackRecommendations(userProfile);
        }
      });
    } catch (error) {
      console.error('Failed to queue AI recommendation request:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  // Predict future carbon emissions
  async predictCarbonEmissions(historicalData: {
    monthly_emissions: number[];
    activities: string[];
    seasonal_factors: boolean;
  }): Promise<CarbonPrediction> {
    // If we're already in fallback mode, don't even try the API
    if (this.fallbackMode || !this.apiKeyValid) {
      console.warn('OpenAI API key not configured or in fallback mode, using fallback prediction');
      return this.getFallbackPrediction(historicalData);
    }
    
    try {
      return await this.queueRequest(async () => {
        try {
          if (!this.apiKey) {
            console.warn('OpenAI API key not configured, using fallback prediction');
            this.lastErrorMessage = 'OpenAI API key not configured';
            this.fallbackMode = true;
            return this.getFallbackPrediction(historicalData);
          }

          const prompt = `
            Analyze this carbon emission data and predict future trends:
            Monthly emissions (last 12 months): ${historicalData.monthly_emissions.join(', ')}
            Key activities: ${historicalData.activities.join(', ')}
            Consider seasonal factors: ${historicalData.seasonal_factors}
            
            Provide a prediction for the next 3 months with confidence level and key factors.
            Respond with a JSON object containing: predictedEmissions (number), trend (string), factors (array), confidence (number), timeframe (string).
          `;

          const response = await this.callAI({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are a data scientist specializing in carbon emission analysis and prediction. Always respond with valid JSON format.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 600
          });

          return this.parsePrediction(response.choices[0].message.content);
        } catch (error) {
          console.error('Carbon prediction failed:', error);
          this.fallbackMode = true;
          this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error predicting emissions';
          return this.getFallbackPrediction(historicalData);
        }
      });
    } catch (error) {
      console.error('Failed to queue carbon prediction request:', error);
      return this.getFallbackPrediction(historicalData);
    }
  }

  // Private helper methods
  private async callAI(payload: any): Promise<any> {
    if (!this.apiKey) {
      this.fallbackMode = true;
      this.lastErrorMessage = 'OpenAI API key not configured';
      throw new AppError('OpenAI API key not configured', 500);
    }

    if (!this.apiKey.startsWith('sk-')) {
      this.fallbackMode = true;
      this.lastErrorMessage = 'Invalid OpenAI API key format';
      throw new AppError('Invalid OpenAI API key format', 500);
    }

    try {
      console.log(`Making API request to ${this.baseUrl}/chat/completions with model ${payload.model}`);
      
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
            console.error('OpenAI API error details:', errorData.error);
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          console.error('Failed to parse error response:', parseError);
        }

        if (response.status === 401) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'Invalid API key';
          errorMessage = 'Invalid API key. Please check your VITE_OPENAI_API_KEY in the .env file.';
        } else if (response.status === 429) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'Rate limit exceeded';
          errorMessage = 'OpenAI rate limit exceeded. Please wait a moment and try again. Your current plan may have usage limits.';
        } else if (response.status === 403) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'API access forbidden';
          errorMessage = 'OpenAI API access forbidden. Please check your API key permissions and billing status.';
        } else if (response.status === 404 && errorMessage.includes('model')) {
          this.fallbackMode = true;
          this.lastErrorMessage = `Model ${this.model} not available`;
          errorMessage = `The AI model "${this.model}" is not available with your API key. Try using "gpt-3.5-turbo" instead.`;
        } else if (response.status >= 500) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'OpenAI service unavailable';
          errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
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
        this.fallbackMode = true;
        this.lastErrorMessage = 'Network error connecting to OpenAI';
        throw new AppError('Network error: Unable to connect to OpenAI service. Please check your internet connection.', 500);
      }
      
      this.fallbackMode = true;
      this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown OpenAI service error';
      throw new AppError(`OpenAI service error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  // Reset fallback mode - useful for testing
  public resetFallbackMode(): void {
    this.fallbackMode = false;
    this.lastErrorMessage = '';
    console.log('AI service fallback mode reset');
  }
  
  // Check if in fallback mode
  public isInFallbackMode(): boolean {
    return this.fallbackMode;
  }
  
  // Get the last error message
  public getLastErrorMessage(): string {
    return this.lastErrorMessage;
  }

  // Check if API key is valid
  public isApiKeyValid(): boolean {
    return this.apiKeyValid;
  }

  // For debugging - get API key status
  public getApiKeyStatus(): string {
    if (!this.apiKey) return 'Missing';
    if (!this.apiKeyValid) return 'Invalid format';
    if (this.fallbackMode) return 'Valid but service unavailable';
    return 'Valid and working';
  }
}

export const aiService = new AIService();
      try {
        if (!this.apiKey) {
          console.warn('OpenAI API key not configured, using fallback recommendations for user profile:', userProfile);
          this.lastErrorMessage = 'OpenAI API key not configured';
          this.fallbackMode = true;
          return this.getFallbackRecommendations(userProfile);
        }

        const prompt = this.buildRecommendationPrompt(userProfile);
        
        const response = await this.callAI({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert carbon footprint advisor. Provide specific, actionable recommendations for reducing carbon emissions and purchasing carbon credits. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1200
        });

        return this.parseRecommendations(response.choices[0].message.content, userProfile);
      } catch (error) {
        console.error('AI recommendation generation failed:', error);
        // Enable fallback mode for future requests
        this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error generating recommendations';
        this.fallbackMode = true;
        notificationService.warning(
          'Using Fallback Recommendations',
          'AI service is currently unavailable. Using pre-generated recommendations instead.'
        );
        return this.getFallbackRecommendations(userProfile);
      }
    });
  }

  // Predict future carbon emissions
  async predictCarbonEmissions(historicalData: {
    monthly_emissions: number[];
    activities: string[];
    seasonal_factors: boolean;
  }): Promise<CarbonPrediction> {
    return this.queueRequest(async () => {
      try {
        if (this.fallbackMode || !this.apiKey) {
          console.warn('OpenAI API key not configured, using fallback prediction');
          this.lastErrorMessage = 'OpenAI API key not configured';
          return this.getFallbackPrediction(historicalData);
        }

        const prompt = `
          Analyze this carbon emission data and predict future trends:
          Monthly emissions (last 12 months): ${historicalData.monthly_emissions.join(', ')}
          Key activities: ${historicalData.activities.join(', ')}
          Consider seasonal factors: ${historicalData.seasonal_factors}
          
          Provide a prediction for the next 3 months with confidence level and key factors.
          Respond with a JSON object containing: predictedEmissions (number), trend (string), factors (array), confidence (number), timeframe (string).
        `;

        const response = await this.callAI({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a data scientist specializing in carbon emission analysis and prediction. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 600
        });

        return this.parsePrediction(response.choices[0].message.content);
      } catch (error) {
        console.error('Carbon prediction failed:', error);
        this.fallbackMode = true;
        this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error predicting emissions';
        return this.getFallbackPrediction(historicalData);
      }
    });
  }

  // Analyze carbon efficiency and provide insights
  async analyzeEfficiency(userData: {
    emissions: number;
    activities: Record<string, number>;
    location: string;
    demographics: string;
  }): Promise<AIInsights> {
    return this.queueRequest(async () => {
      try {
        if (this.fallbackMode || !this.apiKey) {
          console.warn('OpenAI API key not configured, using fallback insights');
          this.lastErrorMessage = 'OpenAI API key not configured';
          return this.getFallbackInsights(userData);
        }

        const prompt = `
          Analyze carbon efficiency for this user profile:
          Total emissions: ${userData.emissions} tons CO2/year
          Activity breakdown: ${JSON.stringify(userData.activities)}
          Location: ${userData.location}
          Demographics: ${userData.demographics}
          
          Provide efficiency score (0-100), benchmark comparisons, and improvement potential.
          Respond with JSON containing: carbonEfficiencyScore, benchmarkComparison (object with industry, region, similar_users), improvementPotential.
        `;

        const response = await this.callAI({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a carbon efficiency analyst. Provide detailed analysis with scores and actionable insights. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 800
        });

        return this.parseInsights(response.choices[0].message.content);
      } catch (error) {
        console.error('Efficiency analysis failed:', error);
        this.fallbackMode = true;
        this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error analyzing efficiency';
        return this.getFallbackInsights(userData);
      }
    });
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
    return this.queueRequest(async () => {
      try {
        if (this.fallbackMode || !this.apiKey) {
          console.warn('OpenAI API key not configured, using fallback credit recommendations');
          this.lastErrorMessage = 'OpenAI API key not configured';
          return this.getFallbackCreditRecommendations(preferences);
        }

        // This would integrate with your marketplace data
        const availableCredits = await apiService.get('/marketplace/credits').catch(() => []);
        
        const prompt = `
          Recommend carbon credits based on these preferences:
          Budget: $${preferences.budget}
          Impact preferences: ${preferences.impact_preference.join(', ')}
          Location preferences: ${preferences.location_preference.join(', ')}
          Certifications: ${preferences.certification_preference.join(', ')}
          Risk tolerance: ${preferences.risk_tolerance}
          
          Provide specific recommendations with reasoning and portfolio allocation.
          Respond with JSON containing: recommended_credits (array), reasoning (string), portfolio_allocation (object).
        `;

        const response = await this.callAI({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a carbon credit investment advisor. Provide specific, well-reasoned recommendations. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 800
        });

        return this.parseCreditRecommendations(response.choices[0].message.content, availableCredits);
      } catch (error) {
        console.error('Credit recommendation failed:', error);
        this.fallbackMode = true;
        this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error recommending credits';
        return this.getFallbackCreditRecommendations(preferences);
      }
    });
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
    return this.queueRequest(async () => {
      try {
        if (this.fallbackMode || !this.apiKey) {
          console.warn('OpenAI API key not configured, using fallback behavior analysis');
          this.lastErrorMessage = 'OpenAI API key not configured';
          return this.getFallbackBehaviorAnalysis();
        }

        const prompt = `
          Analyze user behavior patterns for carbon impact:
          Recent activities: ${JSON.stringify(activityData.daily_activities.slice(-7))}
          Identified patterns: ${activityData.patterns.join(', ')}
          User goals: ${activityData.goals.join(', ')}
          
          Provide behavioral insights, score (0-100), and specific habit recommendations.
          Respond with JSON containing: insights (array), behavior_score (number), improvement_suggestions (array), habit_recommendations (array).
        `;

        const response = await this.callAI({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a behavioral analyst specializing in sustainability habits and carbon reduction. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
          max_tokens: 600
        });

        return this.parseBehaviorAnalysis(response.choices[0].message.content);
      } catch (error) {
        console.error('Behavior analysis failed:', error);
        this.fallbackMode = true;
        this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error analyzing behavior';
        return this.getFallbackBehaviorAnalysis();
      }
    });
  }

  // Private helper methods
  private async callAI(payload: any): Promise<any> {
    if (!this.apiKey) {
      this.fallbackMode = true;
      this.lastErrorMessage = 'OpenAI API key not configured';
      throw new AppError('OpenAI API key not configured', 500);
    }

    if (!this.apiKey.startsWith('sk-')) {
      this.fallbackMode = true;
      this.lastErrorMessage = 'Invalid OpenAI API key format';
      throw new AppError('Invalid OpenAI API key format', 500);
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
          this.fallbackMode = true;
          this.lastErrorMessage = 'Invalid API key';
          errorMessage = 'Invalid API key. Please check your VITE_OPENAI_API_KEY in the .env file.';
        } else if (response.status === 429) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'Rate limit exceeded';
          errorMessage = 'OpenAI rate limit exceeded. Please wait a moment and try again. Your current plan may have usage limits.';
        } else if (response.status === 403) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'API access forbidden';
          errorMessage = 'OpenAI API access forbidden. Please check your API key permissions and billing status.';
        } else if (response.status === 404 && errorMessage.includes('model')) {
          this.fallbackMode = true;
          this.lastErrorMessage = `Model ${this.model} not available`;
          errorMessage = `The AI model "${this.model}" is not available with your API key. Try using "gpt-3.5-turbo" instead.`;
        } else if (response.status >= 500) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'OpenAI service unavailable';
          errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
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
        this.fallbackMode = true;
        this.lastErrorMessage = 'Network error connecting to OpenAI';
        throw new AppError('Network error: Unable to connect to OpenAI service. Please check your internet connection.', 500);
      }
      
      this.fallbackMode = true;
      this.lastErrorMessage = error instanceof Error ? error.message : 'Unknown OpenAI service error';
      throw new AppError(`OpenAI service error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  private buildRecommendationPrompt(userProfile: any): string {
    return `
      Generate 3-4 specific carbon reduction recommendations for this user:
      
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
      6. Action steps (3-4 specific steps)
      7. Estimated cost
      8. Timeframe
      9. Priority level
      
      Respond with a JSON array of recommendation objects with these exact field names:
      title, description, impact, confidence, category, action_steps, estimated_cost, timeframe, priority
    `;
  }

  private parseRecommendations(aiResponse: string, userProfile: any): AIRecommendation[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/) || aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let recommendations;
        try {
          recommendations = JSON.parse(jsonMatch[0]);
          if (!Array.isArray(recommendations)) {
            recommendations = [recommendations];
          }
        } catch (parseError) {
          console.error('Failed to parse AI JSON response:', parseError);
          return this.getFallbackRecommendations(userProfile);
        }

        return recommendations.map((rec: any, index: number) => ({
          id: `ai-rec-${Date.now()}-${index}`,
          type: this.categorizeRecommendationType(rec.category || 'general'),
          title: rec.title || 'Carbon Reduction Recommendation',
          description: rec.description || 'Reduce your carbon footprint',
          impact: parseFloat(rec.impact) || 1.0,
          confidence: parseInt(rec.confidence) || 80,
          category: rec.category || 'General',
          rewardPotential: Math.floor((parseFloat(rec.impact) || 1.0) * 10),
          actionSteps: Array.isArray(rec.action_steps) ? rec.action_steps : 
                      typeof rec.action_steps === 'string' ? [rec.action_steps] : 
                      ['Implement this recommendation'],
          estimatedCost: parseFloat(rec.estimated_cost) || 0,
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
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const prediction = JSON.parse(jsonMatch[0]);
        return {
          predictedEmissions: parseFloat(prediction.predictedEmissions) || 25.5,
          trend: prediction.trend || 'stable',
          factors: Array.isArray(prediction.factors) ? prediction.factors : ['Historical trends'],
          confidence: parseInt(prediction.confidence) || 85,
          timeframe: prediction.timeframe || '3 months'
        };
      }
    } catch (error) {
      console.error('Failed to parse prediction:', error);
    }
    
    return this.getFallbackPrediction({});
  }

  private parseInsights(aiResponse: string): AIInsights {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return {
          carbonEfficiencyScore: parseInt(insights.carbonEfficiencyScore) || 78,
          benchmarkComparison: insights.benchmarkComparison || {
            industry: 65,
            region: 72,
            similar_users: 81
          },
          improvementPotential: parseInt(insights.improvementPotential) || 22,
          keyRecommendations: []
        };
      }
    } catch (error) {
      console.error('Failed to parse insights:', error);
    }
    
    return this.getFallbackInsights({});
  }

  private parseCreditRecommendations(aiResponse: string, availableCredits: any[]): any {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return {
          recommended_credits: recommendations.recommended_credits || availableCredits.slice(0, 3),
          reasoning: recommendations.reasoning || 'Based on your preferences and budget constraints.',
          portfolio_allocation: recommendations.portfolio_allocation || {
            'forest': 60,
            'renewable': 30,
            'efficiency': 10
          }
        };
      }
    } catch (error) {
      console.error('Failed to parse credit recommendations:', error);
    }
    
    return this.getFallbackCreditRecommendations({});
  }

  private parseBehaviorAnalysis(aiResponse: string): any {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          insights: Array.isArray(analysis.insights) ? analysis.insights : ['Consistent daily tracking'],
          behavior_score: parseInt(analysis.behavior_score) || 82,
          improvement_suggestions: Array.isArray(analysis.improvement_suggestions) ? 
            analysis.improvement_suggestions : ['Continue tracking activities'],
          habit_recommendations: Array.isArray(analysis.habit_recommendations) ? 
            analysis.habit_recommendations : ['Maintain current habits']
        };
      }
    } catch (error) {
      console.error('Failed to parse behavior analysis:', error);
    }
    
    return this.getFallbackBehaviorAnalysis();
  }

  // Fallback methods for when AI is unavailable
  private getFallbackRecommendations(userProfile: any): AIRecommendation[] {
    console.log('Using fallback recommendations for profile:', userProfile);
    return [
      {
        id: 'fallback-1',
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
        priority: 'medium'
      },
      {
        id: 'fallback-2',
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
        priority: 'high'
      },
      {
        id: 'fallback-3',
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
        priority: 'high'
      },
      {
        id: 'fallback-4',
        type: 'optimization',
        title: 'Smart Home Automation',
        description: 'Use technology to automatically optimize your energy consumption',
        impact: 2.8,
        confidence: 75,
        category: 'Technology',
        rewardPotential: 28,
        actionSteps: [
          'Install smart power strips to eliminate phantom loads',
          'Use smart thermostats with learning capabilities',
          'Set up automated lighting schedules',
          'Monitor energy usage with smart meters'
        ],
        estimatedCost: 400,
        timeframe: '3-4 weeks',
        priority: 'medium'
      }
    ];
  }

  private getFallbackPrediction(historicalData: any): CarbonPrediction {
    const recentEmissions = historicalData.monthly_emissions || [32.4];
    const avgEmissions = recentEmissions.reduce((a: number, b: number) => a + b, 0) / recentEmissions.length;
    const trend = recentEmissions.length > 1 && recentEmissions[recentEmissions.length - 1] < recentEmissions[0] ? 'decreasing' : 'stable';
    
    return {
      predictedEmissions: Math.max(avgEmissions * 0.95, 20), // Slight improvement expected
      trend,
      factors: ['Historical trends', 'Seasonal patterns', 'Energy efficiency improvements'],
      confidence: 85,
      timeframe: '3 months'
    };
  }

  private getFallbackInsights(userData: any): AIInsights {
    const emissions = userData.emissions || 32.4;
    const efficiencyScore = Math.max(100 - Math.floor(emissions * 2), 40); // Lower emissions = higher score
    
    return {
      carbonEfficiencyScore: efficiencyScore,
      benchmarkComparison: {
        industry: Math.max(efficiencyScore - 10, 30),
        region: Math.max(efficiencyScore - 5, 35),
        similar_users: Math.max(efficiencyScore + 5, 45)
      },
      improvementPotential: Math.min(100 - efficiencyScore, 40),
      keyRecommendations: []
    };
  }

  private getFallbackCreditRecommendations(preferences: any): any {
    const budget = preferences.budget || 500;
    
    return {
      recommended_credits: [
        {
          type: 'forest_conservation',
          amount: Math.floor(budget * 0.4 / 45),
          price: 45,
          description: 'Amazon Rainforest Protection Project',
          location: 'Brazil'
        },
        {
          type: 'renewable_energy',
          amount: Math.floor(budget * 0.35 / 32),
          price: 32,
          description: 'Wind Energy Development',
          location: 'Texas, USA'
        },
        {
          type: 'carbon_capture',
          amount: Math.floor(budget * 0.25 / 85),
          price: 85,
          description: 'Direct Air Capture Technology',
          location: 'Iceland'
        }
      ],
      reasoning: `Based on your budget of $${budget} and preferences, we recommend a diversified portfolio focusing on forest conservation (40%), renewable energy (35%), and carbon capture technology (25%). This allocation balances cost-effectiveness with high-impact projects.`,
      portfolio_allocation: {
        'forest': 40,
        'renewable': 35,
        'capture': 25
      }
    };
  }

  private getFallbackBehaviorAnalysis(): any {
    return {
      insights: [
        'Your carbon tracking shows consistent engagement with sustainability',
        'Transportation appears to be your largest emission source',
        'Energy usage patterns suggest room for optimization',
        'You show strong commitment to environmental goals'
      ],
      behavior_score: 78,
      improvement_suggestions: [
        'Focus on reducing transportation emissions through alternative mobility',
        'Implement energy-saving habits during peak usage hours',
        'Consider renewable energy options for your home',
        'Track and celebrate small daily improvements'
      ],
      habit_recommendations: [
        'Set up automated energy-saving schedules',
        'Plan weekly sustainable transportation goals',
        'Create monthly carbon reduction challenges',
        'Join local environmental community groups'
      ]
    };
  }

  // Reset fallback mode - useful for testing
  public resetFallbackMode(): void {
    this.fallbackMode = false;
    this.lastErrorMessage = '';
  }
  
  // Check if in fallback mode
  public isInFallbackMode(): boolean {
    return this.fallbackMode;
  }
  
  // Get the last error message
  public getLastErrorMessage(): string {
    return this.lastErrorMessage;
  }
}

export const aiService = new AIService();