import { IsString, IsArray, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdatePreferencesDto {
  @ApiProperty({ example: 'San Francisco, CA', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: ['urban', 'tech_worker'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifestyle?: string[];

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100000)
  budget?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @ApiProperty({ example: 'light', required: false })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({ example: ['renewable_energy', 'forest_conservation'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];

  @ApiProperty({ example: 'medium', required: false })
  @IsOptional()
  @IsString()
  riskTolerance?: string;
}