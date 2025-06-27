import { IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeBehaviorDto {
  @ApiProperty({
    example: [
      { date: '2024-01-15', electricity: 12, transport: 8, heating: 5 },
      { date: '2024-01-14', electricity: 11, transport: 12, heating: 6 }
    ]
  })
  @IsArray()
  @IsObject({ each: true })
  daily_activities: Record<string, any>[];

  @ApiProperty({ example: ['weekend_spikes', 'morning_commute', 'evening_heating'] })
  @IsArray()
  patterns: string[];

  @ApiProperty({ example: ['reduce_transport', 'optimize_heating', 'carbon_neutral'] })
  @IsArray()
  goals: string[];
}