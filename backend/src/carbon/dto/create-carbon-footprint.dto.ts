import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCarbonFootprintDto {
  @ApiProperty({ example: 800, description: 'Electricity usage in kWh/month' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10000)
  electricity: number;

  @ApiProperty({ example: 1200, description: 'Transportation in miles/month' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(50000)
  transportation: number;

  @ApiProperty({ example: 100, description: 'Heating usage in therms/month' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1000)
  heating: number;

  @ApiProperty({ example: 4, description: 'Air travel flights per year' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  airTravel: number;

  @ApiProperty({ example: 'Monthly calculation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}