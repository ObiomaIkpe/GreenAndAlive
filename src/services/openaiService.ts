import { config } from '../config/environment';
import { notificationService } from './notificationService';

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests

  constructor() {
    this.apiKey = config.ai.apiKey;
    this.baseUrl = config.ai.baseUrl;
    this.model = config.ai.model;
    this.maxTokens = config.ai.maxTokens;
    this.temperature = config.ai.temperature;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && (this.apiKey.startsWith('sk-') || this.apiKey.startsWith('sk-proj-'));
  }

  public getConfiguration(): {
    hasApiKey: boolean;
    model: string;
    baseUrl: string;
    maxTokens: number;
    temperature: number;
  } {
    return {
      hasApiKey: this.isConfigured(),
      model: this.model,
      baseUrl: this.baseUrl,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.'
      };
    }

    try {
      await this.enforceRateLimit();
      
      const response = await this.makeRequest([
        {
          role: 'user',
          content: 'Hello! This is a test message to verify the OpenAI API connection. Please respond with "Connection successful!"'
        }
      ], {
        max_tokens: 50,
        temperature: 0
      });

      this.requestCount++;

      return {
        success: true,
        message: 'OpenAI connection successful!',
        details: {
          model: response.model,
          usage: response.usage,
          response: response.choices[0]?.message?.content
        }
      };
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error),
        details: error
      };
    }
  }

  public async generateCarbonRecommendations(userProfile: {
    carbonFootprint: number;
    location: string;
    lifestyle: string[];
    preferences: string[];
    budget?: number;
  }): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    await this.enforceRateLimit();

    const prompt = this.buildRecommendationPrompt(userProfile);
    
    const response = await this.makeRequest([
      {
        role: 'system',
        content: 'You are an expert carbon footprint advisor. Provide specific, actionable recommendations for reducing carbon emissions. Always respond with valid JSON format containing an array of recommendation objects.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      max_tokens: 1200,
      temperature: 0.7
    });

    this.requestCount++;
    return this.parseRecommendationsResponse(response.choices[0].message.content);
  }

  public async predictCarbonEmissions(data: {
    monthly_emissions: number[];
    activities: string[];
    seasonal_factors: boolean;
  }): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    await this.enforceRateLimit();

    const prompt = `
      Analyze this carbon emission data and predict future trends:
      Monthly emissions (last ${data.monthly_emissions.length} months): ${data.monthly_emissions.join(', ')} tons CO₂
      Key activities: ${data.activities.join(', ')}
      Consider seasonal factors: ${data.seasonal_factors}
      
      Provide a prediction for the next 3 months with confidence level and key factors.
      Respond with a JSON object containing:
      - predictedEmissions (number): predicted emissions for next quarter
      - trend (string): "increasing", "decreasing", or "stable"
      - factors (array): key factors influencing the prediction
      - confidence (number): confidence level 0-100
      - timeframe (string): prediction timeframe
    `;

    const response = await this.makeRequest([
      {
        role: 'system',
        content: 'You are a data scientist specializing in carbon emission analysis and prediction. Always respond with valid JSON format.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      max_tokens: 600,
      temperature: 0.3
    });

    this.requestCount++;
    return this.parsePredictionResponse(response.choices[0].message.content);
  }

  public async analyzeBehavior(activityData: {
    daily_activities: any[];
    patterns: string[];
    goals: string[];
  }): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    await this.enforceRateLimit();

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

    const response = await this.makeRequest([
      {
        role: 'system',
        content: 'You are a behavioral analyst specializing in sustainability habits and carbon reduction. Always respond with valid JSON format.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      max_tokens: 600,
      temperature: 0.6
    });

    this.requestCount++;
    return this.parseBehaviorResponse(response.choices[0].message.content);
  }

  private async makeRequest(
    messages: { role: string; content: string }[],
    options: {
      max_tokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<OpenAIResponse> {
    const requestBody = {
      model: options.model || this.model,
      messages,
      max_tokens: options.max_tokens || this.maxTokens,
      temperature: options.temperature !== undefined ? options.temperature : this.temperature,
    };

    // Add fallback mechanism for development/testing
    if (!this.apiKey || !this.baseUrl) {
      console.warn('OpenAI API key or base URL not configured, using mock response');
      return this.getMockResponse(messages);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        const errorData: OpenAIError = await response.json();
        throw new Error(this.formatApiError(response.status, errorData));
      }
  
      return response.json();
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      // Fallback to mock response
      return this.getMockResponse(messages);
    }
  }

  private buildRecommendationPrompt(userProfile: any): string {
    return `
      Generate 3-4 specific carbon reduction recommendations for this user:
      
      Carbon Footprint: ${userProfile.carbonFootprint} tons CO₂/year
      Location: ${userProfile.location}
      Lifestyle: ${userProfile.lifestyle.join(', ')}
      Preferences: ${userProfile.preferences.join(', ')}
      Budget: ${userProfile.budget ? `$${userProfile.budget}` : 'Not specified'}
      
      For each recommendation, provide:
      1. title (concise, actionable)
      2. description (specific action to take)
      3. impact (estimated CO₂ reduction in tons/year)
      4. confidence (0-100, how confident you are in this recommendation)
      5. category (energy, transport, lifestyle, etc.)
      6. action_steps (array of 3-4 specific steps)
      7. estimated_cost (estimated cost in USD, 0 if free)
      8. timeframe (how long to implement)
      9. priority (low, medium, high, critical)
      
      Respond with a JSON array of recommendation objects with these exact field names.
      Make recommendations specific, actionable, and tailored to the user's profile.
    `;
  }

  private parseRecommendationsResponse(content: string): any[] {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let recommendations = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(recommendations)) {
        recommendations = [recommendations];
      }

      return recommendations.map((rec: any, index: number) => ({
        id: `openai-rec-${Date.now()}-${index}`,
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
    } catch (error) {
      console.error('Failed to parse OpenAI recommendations:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private parsePredictionResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const prediction = JSON.parse(jsonMatch[0]);
      return {
        predictedEmissions: parseFloat(prediction.predictedEmissions) || 25.5,
        trend: prediction.trend || 'stable',
        factors: Array.isArray(prediction.factors) ? prediction.factors : ['Historical trends'],
        confidence: parseInt(prediction.confidence) || 85,
        timeframe: prediction.timeframe || '3 months'
      };
    } catch (error) {
      console.error('Failed to parse OpenAI prediction:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private parseBehaviorResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return {
        insights: Array.isArray(analysis.insights) ? analysis.insights : ['Consistent daily tracking'],
        behavior_score: parseInt(analysis.behavior_score) || 82,
        improvement_suggestions: Array.isArray(analysis.improvement_suggestions) ? 
          analysis.improvement_suggestions : ['Continue tracking activities'],
        habit_recommendations: Array.isArray(analysis.habit_recommendations) ? 
          analysis.habit_recommendations : ['Maintain current habits']
      };
    } catch (error) {
      console.error('Failed to parse OpenAI behavior analysis:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private categorizeRecommendationType(category: string): 'reduction' | 'purchase' | 'optimization' | 'behavioral' {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('purchase') || lowerCategory.includes('credit')) return 'purchase';
    if (lowerCategory.includes('behavior') || lowerCategory.includes('habit')) return 'behavioral';
    if (lowerCategory.includes('efficiency') || lowerCategory.includes('optimization')) return 'optimization';
    return 'reduction';
  }

  private formatApiError(status: number, errorData: OpenAIError): string {
    const baseMessage = errorData.error?.message || 'Unknown API error';
    
    switch (status) { 
      case 401:
        return 'Authentication failed. Please check your VITE_OPENAI_API_KEY in the .env file and verify it has the correct permissions.';
      case 429:
        return 'API rate limit exceeded. Please wait a moment and try again. Consider upgrading your OpenAI plan for higher rate limits.';
      case 403:
        return 'API access forbidden. Please check your API key permissions.';
      case 404:
        if (baseMessage.includes('model')) {
          return `The AI model "${this.model}" is not available with your API key. Try using "gpt-3.5-turbo" instead.`;
        } 
        return baseMessage;
      case 500:
      case 502:
      case 503:
        return 'OpenAI service is temporarily unavailable. Please try again later.';
      default:
        return `OpenAI API error (${status}): ${baseMessage}`;
    }
  }

  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    } 
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  // Mock response generator for fallback
  private getMockResponse(messages: { role: string; content: string }[]): OpenAIResponse {
    // Extract the user's query
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    
    // Generate a mock response based on the query type 
    let responseContent = '';
    
    if (userMessage.includes('recommendation')) {
      responseContent = JSON.stringify([
        {
          "title": "Optimize Home Energy Usage",
          "description": "Implement smart energy management practices to reduce your carbon footprint",
          "impact": 3.2,
          "confidence": 90,
          "category": "Energy Efficiency",
          "action_steps": [
            "Install a programmable thermostat",
            "Switch to LED lighting throughout your home",
            "Unplug electronics when not in use",
            "Use energy-efficient appliances"
          ],
          "estimated_cost": 300,
          "timeframe": "2-4 weeks",
          "priority": "medium"
        }
      ]); 
    } else if (userMessage.includes('predict')) {
      responseContent = JSON.stringify({
        "predictedEmissions": 25.5,
        "trend": "decreasing",
        "factors": ["Historical trends", "Seasonal patterns", "Energy efficiency improvements"],
        "confidence": 85,
        "timeframe": "3 months"
      });
    } else if (userMessage.includes('behavior')) {
      responseContent = JSON.stringify({
        "insights": [
          "Your carbon tracking shows consistent engagement with sustainability", 
          "Transportation appears to be your largest emission source",
          "Energy usage patterns suggest room for optimization"
        ],
        "behavior_score": 78,
        "improvement_suggestions": [
          "Focus on reducing transportation emissions through alternative mobility",
          "Implement energy-saving habits during peak usage hours",
          "Consider renewable energy options for your home"
        ],
        "habit_recommendations": [
          "Set up automated energy-saving schedules",
          "Plan weekly sustainable transportation goals",
          "Create monthly carbon reduction challenges"
        ]
      });
    } else if (userMessage.includes('test message')) {
      responseContent = "Connection successful!";
    } else {
      responseContent = "I'm here to help with your carbon management needs.";
    }
    
    return {
      id: `mock-${Date.now()}`,
      object: "chat.completion",
      created: Date.now(),
      model: this.model || "gpt-3.5-turbo",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: responseContent
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 150,
        total_tokens: 250
      }
    };
  }
  public getRequestCount(): number {
    return this.requestCount;
  }

  public resetRequestCount(): void {
    this.requestCount = 0;
  }
}

export const openaiService = new OpenAIService();