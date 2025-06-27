import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePurchaseDto {
  @ApiProperty({ example: 'uuid-of-carbon-credit' })
  @IsString()
  carbonCreditId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(10000)
  quantity: number;

  @ApiProperty({ example: 'Purchase for monthly offset', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}