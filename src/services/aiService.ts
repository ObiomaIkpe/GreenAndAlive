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
      this.lastErrorMessage = 'OpenAI API key not configured';
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