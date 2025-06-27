import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { AiRecommendation } from './entities/ai-recommendation.entity';
import { User } from '../users/entities/user.entity';
import { CarbonFootprint } from '../carbon/entities/carbon-footprint.entity';
import { GenerateRecommendationsDto } from './dto/generate-recommendations.dto';
import { PredictEmissionsDto } from './dto/predict-emissions.dto';
import { AnalyzeBehaviorDto } from './dto/analyze-behavior.dto';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class AiService {
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;
  private readonly openaiBaseUrl: string;

  constructor(
    @InjectRepository(AiRecommendation)
    private aiRecommendationRepository: Repository<AiRecommendation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CarbonFootprint)
    private carbonFootprintRepository: Repository<CarbonFootprint>,
    private configService: ConfigService,
    private httpService: HttpService,
    private logger: LoggerService,
  ) {
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
    this.openaiModel = this.configService.get('OPENAI_MODEL', 'gpt-4');
    this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL', 'https://api.openai.com/v1');
  }

  async generateRecommendations(userId: string, generateRecommendationsDto: GenerateRecommendationsDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preferences'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get latest carbon footprint
    const latestFootprint = await this.carbonFootprintRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const userProfile = {
      carbonFootprint: latestFootprint?.totalEmissions || generateRecommendationsDto.carbonFootprint,
      location: user.preferences?.location || generateRecommendationsDto.location,
      lifestyle: user.preferences?.lifestyle || generateRecommendationsDto.lifestyle,
      preferences: user.preferences?.preferences || generateRecommendationsDto.preferences,
      budget: user.preferences?.budget || generateRecommendationsDto.budget,
    };

    try {
      const aiRecommendations = await this.callOpenAI(this.buildRecommendationPrompt(userProfile));
      
      // Save recommendations to database
      const savedRecommendations = [];
      for (const rec of aiRecommendations) {
        const recommendation = this.aiRecommendationRepository.create({
          ...rec,
          userId,
        });
        savedRecommendations.push(await this.aiRecommendationRepository.save(recommendation));
      }

      return savedRecommendations;
    } catch (error) {
      this.logger.error('Failed to generate AI recommendations', error.stack, 'AiService');
      return this.getFallbackRecommendations(userId, userProfile);
    }
  }

  async predictEmissions(predictEmissionsDto: PredictEmissionsDto) {
    try {
      const prompt = this.buildPredictionPrompt(predictEmissionsDto);
      const prediction = await this.callOpenAI(prompt, 'prediction');
      return prediction;
    } catch (error) {
      this.logger.error('Failed to predict emissions', error.stack, 'AiService');
      return this.getFallbackPrediction(predictEmissionsDto);
    }
  }

  async analyzeBehavior(analyzeBehaviorDto: AnalyzeBehaviorDto) {
    try {
      const prompt = this.buildBehaviorPrompt(analyzeBehaviorDto);
      const analysis = await this.callOpenAI(prompt, 'behavior');
      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze behavior', error.stack, 'AiService');
      return this.getFallbackBehaviorAnalysis();
    }
  }

  async getUserRecommendations(userId: string, filters?: {
    type?: string;
    implemented?: boolean;
    dismissed?: boolean;
  }) {
    const query = this.aiRecommendationRepository.createQueryBuilder('rec')
      .where('rec.userId = :userId', { userId });

    if (filters?.type) {
      query.andWhere('rec.type = :type', { type: filters.type });
    }

    if (filters?.implemented !== undefined) {
      query.andWhere('rec.implemented = :implemented', { implemented: filters.implemented });
    }

    if (filters?.dismissed !== undefined) {
      query.andWhere('rec.dismissed = :dismissed', { dismissed: filters.dismissed });
    }

    return query.orderBy('rec.createdAt', 'DESC').getMany();
  }

  async implementRecommendation(userId: string, recommendationId: string, notes?: string) {
    const recommendation = await this.aiRecommendationRepository.findOne({
      where: { id: recommendationId, userId },
    });

    if (!recommendation) {
      throw new BadRequestException('Recommendation not found');
    }

    recommendation.implemented = true;
    recommendation.implementationNotes = notes;

    return this.aiRecommendationRepository.save(recommendation);
  }

  async dismissRecommendation(userId: string, recommendationId: string) {
    const recommendation = await this.aiRecommendationRepository.findOne({
      where: { id: recommendationId, userId },
    });

    if (!recommendation) {
      throw new BadRequestException('Recommendation not found');
    }

    recommendation.dismissed = true;
    return this.aiRecommendationRepository.save(recommendation);
  }

  private async callOpenAI(prompt: string, type: string = 'recommendation'): Promise<any> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompts = {
      recommendation: 'You are an expert carbon footprint advisor. Provide specific, actionable recommendations for reducing carbon emissions. Always respond with valid JSON format.',
      prediction: 'You are a data scientist specializing in carbon emission analysis and prediction. Always respond with valid JSON format.',
      behavior: 'You are a behavioral analyst specializing in sustainability habits and carbon reduction. Always respond with valid JSON format.',
    };

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: this.openaiModel,
          messages: [
            { role: 'system', content: systemPrompts[type] },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1200,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const content = response.data.choices[0].message.content;
    return this.parseAIResponse(content, type);
  }

  private buildRecommendationPrompt(userProfile: any): string {
    return `
      Generate 3-4 specific carbon reduction recommendations for this user:
      
      Carbon Footprint: ${userProfile.carbonFootprint} tons CO₂/year
      Location: ${userProfile.location}
      Lifestyle: ${userProfile.lifestyle?.join(', ')}
      Preferences: ${userProfile.preferences?.join(', ')}
      Budget: ${userProfile.budget ? `$${userProfile.budget}` : 'Not specified'}
      
      For each recommendation, provide:
      1. type (reduction, purchase, optimization, behavioral)
      2. title (concise, actionable)
      3. description (specific action to take)
      4. impact (estimated CO₂ reduction in tons/year)
      5. confidence (0-100)
      6. category (energy, transport, lifestyle, etc.)
      7. actionSteps (array of 3-4 specific steps)
      8. estimatedCost (estimated cost in USD, 0 if free)
      9. timeframe (how long to implement)
      10. priority (low, medium, high, critical)
      11. rewardPotential (estimated token rewards)
      
      Respond with a JSON array of recommendation objects.
    `;
  }

  private buildPredictionPrompt(data: PredictEmissionsDto): string {
    return `
      Analyze this carbon emission data and predict future trends:
      Monthly emissions: ${data.monthly_emissions.join(', ')} tons CO₂
      Key activities: ${data.activities.join(', ')}
      Consider seasonal factors: ${data.seasonal_factors}
      
      Respond with JSON containing:
      - predictedEmissions (number): predicted emissions for next quarter
      - trend (string): "increasing", "decreasing", or "stable"
      - factors (array): key factors influencing the prediction
      - confidence (number): confidence level 0-100
      - timeframe (string): prediction timeframe
    `;
  }

  private buildBehaviorPrompt(data: AnalyzeBehaviorDto): string {
    return `
      Analyze user behavior patterns for carbon impact:
      Recent activities: ${JSON.stringify(data.daily_activities.slice(-7))}
      Identified patterns: ${data.patterns.join(', ')}
      User goals: ${data.goals.join(', ')}
      
      Respond with JSON containing:
      - insights (array): key behavioral insights
      - behavior_score (number): overall behavior score 0-100
      - improvement_suggestions (array): specific improvement suggestions
      - habit_recommendations (array): recommended habits to adopt
    `;
  }

  private parseAIResponse(content: string, type: string): any {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (type === 'recommendation') {
        const recommendations = Array.isArray(parsed) ? parsed : [parsed];
        return recommendations.map((rec, index) => ({
          type: rec.type || 'reduction',
          title: rec.title || 'Carbon Reduction Recommendation',
          description: rec.description || 'Reduce your carbon footprint',
          impact: parseFloat(rec.impact) || 1.0,
          confidence: parseInt(rec.confidence) || 80,
          category: rec.category || 'General',
          rewardPotential: rec.rewardPotential || Math.floor((parseFloat(rec.impact) || 1.0) * 10),
          actionSteps: Array.isArray(rec.actionSteps) ? rec.actionSteps : ['Implement this recommendation'],
          estimatedCost: parseFloat(rec.estimatedCost) || 0,
          timeframe: rec.timeframe || '1-3 months',
          priority: rec.priority || 'medium',
        }));
      }

      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse AI response', error.stack, 'AiService');
      throw new Error('Failed to parse AI response');
    }
  }

  private async getFallbackRecommendations(userId: string, userProfile: any) {
    const fallbackRecs = [
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
        userId,
      },
    ];

    const savedRecs = [];
    for (const rec of fallbackRecs) {
      const recommendation = this.aiRecommendationRepository.create(rec);
      savedRecs.push(await this.aiRecommendationRepository.save(recommendation));
    }

    return savedRecs;
  }

  private getFallbackPrediction(data: any) {
    const avgEmissions = data.monthly_emissions?.reduce((a, b) => a + b, 0) / data.monthly_emissions?.length || 25.5;
    return {
      predictedEmissions: Math.max(avgEmissions * 0.95, 20),
      trend: 'stable',
      factors: ['Historical trends', 'Seasonal patterns', 'Energy efficiency improvements'],
      confidence: 85,
      timeframe: '3 months',
    };
  }

  private getFallbackBehaviorAnalysis() {
    return {
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
  }
}