import { IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PredictEmissionsDto {
  @ApiProperty({ example: [45, 42, 48, 41, 39, 37, 35, 33, 31, 29, 27, 25] })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  monthly_emissions: number[];

  @ApiProperty({ example: ['electricity', 'transportation', 'heating'] })
  @IsArray()
  activities: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  seasonal_factors: boolean;
}