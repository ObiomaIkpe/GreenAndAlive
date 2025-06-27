import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiRecommendation } from './entities/ai-recommendation.entity';
import { User } from '../users/entities/user.entity';
import { CarbonFootprint } from '../carbon/entities/carbon-footprint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiRecommendation, User, CarbonFootprint]),
    HttpModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}