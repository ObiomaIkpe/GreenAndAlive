import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCarbonCreditDto {
  @ApiProperty({ example: 'forest', enum: ['forest', 'renewable', 'efficiency', 'capture'] })
  @IsString()
  type: string;

  @ApiProperty({ example: 45.50 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1000)
  price: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(1000000)
  quantity: number;

  @ApiProperty({ example: 'Amazon Rainforest, Brazil' })
  @IsString()
  location: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiProperty({ example: 'Protecting 500 hectares of primary rainforest' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  @Type(() => Number)
  @Min(2020)
  @Max(2030)
  vintage: number;

  @ApiProperty({ example: 'EcoForest Initiative' })
  @IsString()
  seller: string;

  @ApiProperty({ example: 'VCS', enum: ['VCS', 'Gold Standard', 'CAR', 'ACR'] })
  @IsString()
  certification: string;

  @ApiProperty({ example: 'token123', required: false })
  @IsOptional()
  @IsString()
  tokenId?: string;

  @ApiProperty({ example: '0x123...', required: false })
  @IsOptional()
  @IsString()
  contractAddress?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  blockchainVerified?: boolean;

  @ApiProperty({ example: '{"project": "rainforest", "methodology": "REDD+"}', required: false })
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiProperty({ example: ['forest', 'conservation', 'biodiversity'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}