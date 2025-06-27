import { IsNumber, IsString, IsArray, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GenerateRecommendationsDto {
  @ApiProperty({ example: 32.4 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1000)
  carbonFootprint: number;

  @ApiProperty({ example: 'San Francisco, CA' })
  @IsString()
  location: string;

  @ApiProperty({ example: ['urban', 'tech_worker'] })
  @IsArray()
  @IsString({ each: true })
  lifestyle: string[];

  @ApiProperty({ example: ['renewable_energy', 'forest_conservation'] })
  @IsArray()
  @IsString({ each: true })
  preferences: string[];

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100000)
  budget?: number;
}