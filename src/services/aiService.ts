import { config } from '../config/environment';
import { apiService } from './api';
import { AppError } from '../utils/errorHandler';
import { aiMetricsService } from './aiMetricsService';
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
    this.model = config.ai.model || 'gpt-4';
    
    // Validate API key format
    if (!this.apiKey) {
      console.warn('OpenAI API key not properly configured, enabling fallback mode');
      this.lastErrorMessage = 'OpenAI API key not configured';
      this.fallbackMode = true;
    } else if (this.apiKey.startsWith('sk-')) {
      console.log('OpenAI API key format appears valid, length:', this.apiKey.length);
      this.apiKeyValid = true;
    } else if (this.apiKey.startsWith('sk-proj-')) {
      console.log('OpenAI API key format appears to be a project key, length:', this.apiKey.length);
      this.apiKeyValid = true;
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
            requestType: 'recommendations',
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
            requestType: 'prediction',
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

  // Analyze user behavior patterns
  async analyzeBehavior(activityData: {
    daily_activities: Record<string, any>[];
    patterns: string[];
    goals: string[];
  }): Promise<any> {
    // If we're already in fallback mode, don't even try the API
    if (this.fallbackMode || !this.apiKeyValid) {
      console.warn('OpenAI API key not configured or in fallback mode, using fallback behavior analysis');
      return this.getFallbackBehaviorAnalysis();
    }
    
    try {
      return await this.queueRequest(async () => {
        try {
          if (!this.apiKey) {
            console.warn('OpenAI API key not configured, using fallback behavior analysis');
            this.lastErrorMessage = 'OpenAI API key not configured';
            this.fallbackMode = true;
            return this.getFallbackBehaviorAnalysis();
          }

          const prompt = `
            Analyze user behavior patterns for carbon impact:
            Recent activities: ${JSON.stringify(activityData.daily_activities.slice(-7))}
            Identified patterns: ${activityData.patterns.join(', ')}
            User goals: ${activityData.goals.join(', ')}
            
            Provide behavioral insights, score (0-100), and specific habit recommendations.
            Respond with JSON containing:
            - insights (array): key behavioral insights
            - behavior_score (number): overall behavior score 0-100
            - improvement_suggestions (array): specific improvement suggestions
            - habit_recommendations (array): recommended habits to adopt
          `;

          const response = await this.callAI({
            requestType: 'behavior',
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
    } catch (error) {
      console.error('Failed to queue behavior analysis request:', error);
      return this.getFallbackBehaviorAnalysis();
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
    // If we're already in fallback mode, don't even try the API
    if (this.fallbackMode || !this.apiKeyValid) {
      console.warn('OpenAI API key not configured or in fallback mode, using fallback credit recommendations');
      return this.getFallbackCreditRecommendations(preferences);
    }
    
    try {
      return await this.queueRequest(async () => {
        try {
          if (!this.apiKey) {
            console.warn('OpenAI API key not configured, using fallback credit recommendations');
            this.lastErrorMessage = 'OpenAI API key not configured';
            this.fallbackMode = true;
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
            requestType: 'credit_recommendations',
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
    } catch (error) {
      console.error('Failed to queue credit recommendation request:', error);
      return this.getFallbackCreditRecommendations(preferences);
    }
  }

  // Private helper methods
  private async callAI(options: {
    requestType: string;
    model: string;
    messages: { role: string; content: string }[];
    temperature: number;
    max_tokens: number;
  }): Promise<any> {
    if (!this.apiKey) {
      this.fallbackMode = true;
      this.lastErrorMessage = 'OpenAI API key not configured';
      throw new AppError('OpenAI API key not configured in environment variables', 500);
    }

    if (!this.apiKey.startsWith('sk-') && !this.apiKey.startsWith('sk-proj-')) {
      this.fallbackMode = true;
      this.lastErrorMessage = 'Invalid OpenAI API key format';
      throw new AppError('Invalid OpenAI API key format', 500);
    }

    try {
      const startTime = Date.now();
      console.log(`Making API request to ${this.baseUrl}/chat/completions with model ${options.model}`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages,
          temperature: options.temperature,
          max_tokens: options.max_tokens
        }),
      });
      
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        let errorMessage = `AI API error (${response.status}): ${response.statusText}`;
        let errorDetails = {};
        
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = `AI API error: ${errorData.error.message}`;
            console.error('OpenAI API error details:', errorData.error);
          }
          errorDetails = errorData.error || {};
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          console.error('Failed to parse error response:', parseError);
        }

        if (response.status === 401) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'Invalid API key';
          errorMessage = 'Invalid API key or authentication failed. Please check your VITE_OPENAI_API_KEY in the .env file.';
        } else if (response.status === 429) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'Rate limit exceeded';
          errorMessage = 'OpenAI rate limit exceeded. Please wait a moment and try again. Your current plan may have usage limits.';
        } else if (response.status === 403) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'API access forbidden';
          errorMessage = 'OpenAI API access forbidden. Please check your API key permissions, billing status, or organization settings.';
        } else if (response.status === 404 && errorMessage.includes('model')) {
          this.fallbackMode = true;
          this.lastErrorMessage = `Model ${this.model} not available`;
          errorMessage = `The AI model "${this.model}" is not available with your API key. Try using "gpt-3.5-turbo" instead.`;
        } else if (response.status >= 500) {
          this.fallbackMode = true;
          this.lastErrorMessage = 'OpenAI service unavailable';
          errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
        }

        // Track the failed request
        aiMetricsService.trackRequest({
          model: options.model,
          requestType: options.requestType,
          responseTime,
          success: false,
          fallbackUsed: true,
          errorMessage,
          metadata: { 
            statusCode: response.status,
            errorDetails
          }
        });

        throw new AppError(errorMessage, response.status);
      }

      // Parse the response
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AppError('Invalid response format from AI API', 500);
      }

      // Track the successful request
      aiMetricsService.trackRequest({
        model: options.model,
        requestType: options.requestType,
        tokensUsed: data.usage?.total_tokens,
        responseTime,
        success: true,
        fallbackUsed: false,
        metadata: { usage: data.usage }
      });

      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMessage = 'Network error: Unable to connect to OpenAI service. Please check your internet connection.';
        this.fallbackMode = true;
        this.lastErrorMessage = 'Network error connecting to OpenAI';
        
        // Track the failed request
        aiMetricsService.trackRequest({
          model: options.model,
          requestType: options.requestType,
          success: false,
          fallbackUsed: true,
          errorMessage,
          metadata: { errorType: 'network' }
        });
        
        throw new AppError(errorMessage, 500);
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
    return this.apiKeyValid && !this.fallbackMode;
  }

  // For debugging - get API key status
  public getApiKeyStatus(): string {
    if (!this.apiKey) return 'Missing';
    if (!this.apiKeyValid) return 'Invalid format'; 
    if (this.apiKey.startsWith('sk-proj-')) return this.fallbackMode ? 'Project key configured but service unavailable' : 'Project key valid and working';
    if (this.fallbackMode) return 'Valid but service unavailable';
    return 'Valid and working';
  }

  private buildRecommendationPrompt(userProfile: any): string {
    return `
      Generate personalized carbon reduction recommendations for this user profile:
      Current carbon footprint: ${userProfile.carbonFootprint} tons CO2/year
      Location: ${userProfile.location}
      Lifestyle factors: ${userProfile.lifestyle.join(', ')}
      Preferences: ${userProfile.preferences.join(', ')}
      Budget: $${userProfile.budget || 'Not specified'}
      
      Provide 3-5 specific, actionable recommendations with impact estimates.
      Include both behavioral changes and carbon credit purchase options.
      Format as JSON array with these exact fields: id, type, title, description, impact, confidence, category, actionSteps, estimatedCost, timeframe, priority.
      
      Make sure each recommendation is specific to the user's location, lifestyle, and preferences.
    `;
  }

  private parseRecommendations(aiResponse: string, userProfile: any): AIRecommendation[] {
    try {
      // Extract JSON from AI response
      console.log('Parsing AI recommendations response:', aiResponse);
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/) || aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let recommendations;
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Handle both array and object responses
        if (Array.isArray(parsed)) {
          recommendations = parsed;
        } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          recommendations = parsed.recommendations;
        } else {
          recommendations = [parsed];
        }

        return recommendations.map((rec: any, index: number) => ({
          id: rec.id || `ai-rec-${index}`,
          type: rec.type || 'optimization',
          title: rec.title || 'Carbon Reduction Recommendation',
          description: rec.description || 'AI-generated recommendation for reducing carbon footprint',
          impact: parseFloat(rec.impact) || 2.5,
          confidence: parseInt(rec.confidence) || 80,
          category: rec.category || 'General',
          rewardPotential: rec.rewardPotential || Math.floor((parseFloat(rec.impact) || 2.5) * 10),
          actionSteps: Array.isArray(rec.actionSteps) ? rec.actionSteps : ['Follow AI recommendation'],
          estimatedCost: rec.estimatedCost || 0,
          timeframe: rec.timeframe || '2-4 weeks',
          priority: rec.priority || 'medium'
        }));
      }
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error);
    }
    
    // Fallback to default recommendations
    return this.getFallbackRecommendations(userProfile);
  }

  private parsePrediction(aiResponse: string): CarbonPrediction {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      console.log('Parsing AI prediction response:', aiResponse);
      if (jsonMatch) {
        const prediction = JSON.parse(jsonMatch[0]);
        return {
          predictedEmissions: parseFloat(prediction.predictedEmissions) || 32.4,
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

  private parseBehaviorAnalysis(aiResponse: string): any {
    try {
      console.log('Parsing AI behavior analysis response:', aiResponse);
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

  private parseCreditRecommendations(aiResponse: string, availableCredits: any[]): any {
    try {
      console.log('Parsing AI credit recommendations response:', aiResponse);
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

  // Fallback methods for when AI is unavailable
  private getFallbackRecommendations(userProfile: any): AIRecommendation[] {
    // Track fallback usage
    aiMetricsService.trackRequest({
      model: 'fallback',
      requestType: 'recommendations',
      success: true,
      fallbackUsed: true,
      metadata: { userProfile }
    });
    
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
    // Track fallback usage
    aiMetricsService.trackRequest({
      model: 'fallback',
      requestType: 'prediction',
      success: true,
      fallbackUsed: true,
      metadata: { historicalData }
    });
    
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

  private getFallbackBehaviorAnalysis(): any {
    // Track fallback usage
    aiMetricsService.trackRequest({
      model: 'fallback',
      requestType: 'behavior',
      success: true,
      fallbackUsed: true
    });
    
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

  private getFallbackCreditRecommendations(preferences: any): any {
    // Track fallback usage
    aiMetricsService.trackRequest({
      model: 'fallback',
      requestType: 'credit_recommendations',
      success: true,
      fallbackUsed: true,
      metadata: { preferences }
    });
    
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
}

export const aiService = new AIService();