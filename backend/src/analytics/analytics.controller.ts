import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user')
  @ApiOperation({ summary: 'Get user analytics data' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  getUserAnalytics(
    @Request() req,
    @Query('timeframe') timeframe?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    return this.analyticsService.getUserAnalytics(req.user.id, timeframe);
  }

  @Get('platform')
  @ApiOperation({ summary: 'Get platform-wide analytics' })
  @ApiResponse({ status: 200, description: 'Platform analytics retrieved successfully' })
  getPlatformAnalytics() {
    return this.analyticsService.getPlatformAnalytics();
  }
}