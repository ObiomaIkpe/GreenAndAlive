import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateRecommendationsDto } from './dto/generate-recommendations.dto';
import { PredictEmissionsDto } from './dto/predict-emissions.dto';
import { AnalyzeBehaviorDto } from './dto/analyze-behavior.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommendations')
  @ApiOperation({ summary: 'Generate AI-powered carbon reduction recommendations' })
  @ApiResponse({ status: 201, description: 'Recommendations generated successfully' })
  generateRecommendations(
    @Request() req,
    @Body() generateRecommendationsDto: GenerateRecommendationsDto,
  ) {
    return this.aiService.generateRecommendations(req.user.id, generateRecommendationsDto);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get user AI recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  getUserRecommendations(
    @Request() req,
    @Query('type') type?: string,
    @Query('implemented') implemented?: boolean,
    @Query('dismissed') dismissed?: boolean,
  ) {
    return this.aiService.getUserRecommendations(req.user.id, {
      type,
      implemented,
      dismissed,
    });
  }

  @Patch('recommendations/:id/implement')
  @ApiOperation({ summary: 'Mark recommendation as implemented' })
  @ApiResponse({ status: 200, description: 'Recommendation marked as implemented' })
  implementRecommendation(
    @Request() req,
    @Param('id') id: string,
    @Body('notes') notes?: string,
  ) {
    return this.aiService.implementRecommendation(req.user.id, id, notes);
  }

  @Patch('recommendations/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a recommendation' })
  @ApiResponse({ status: 200, description: 'Recommendation dismissed' })
  dismissRecommendation(@Request() req, @Param('id') id: string) {
    return this.aiService.dismissRecommendation(req.user.id, id);
  }

  @Post('predict-emissions')
  @ApiOperation({ summary: 'Predict future carbon emissions using AI' })
  @ApiResponse({ status: 200, description: 'Emissions prediction generated' })
  predictEmissions(@Body() predictEmissionsDto: PredictEmissionsDto) {
    return this.aiService.predictEmissions(predictEmissionsDto);
  }

  @Post('analyze-behavior')
  @ApiOperation({ summary: 'Analyze user behavior patterns with AI' })
  @ApiResponse({ status: 200, description: 'Behavior analysis completed' })
  analyzeBehavior(@Body() analyzeBehaviorDto: AnalyzeBehaviorDto) {
    return this.aiService.analyzeBehavior(analyzeBehaviorDto);
  }
}