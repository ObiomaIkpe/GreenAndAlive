import { PartialType } from '@nestjs/swagger';
import { CreateCarbonFootprintDto } from './create-carbon-footprint.dto';

export class UpdateCarbonFootprintDto extends PartialType(CreateCarbonFootprintDto) {}