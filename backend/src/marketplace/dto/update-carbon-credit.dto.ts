import { PartialType } from '@nestjs/swagger';
import { CreateCarbonCreditDto } from './create-carbon-credit.dto';

export class UpdateCarbonCreditDto extends PartialType(CreateCarbonCreditDto) {}