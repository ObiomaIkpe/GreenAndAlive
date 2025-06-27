import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { User } from '../users/entities/user.entity';
import { CarbonFootprint } from '../carbon/entities/carbon-footprint.entity';
import { Purchase } from '../marketplace/entities/purchase.entity';
import { WasteDisposal } from '../waste/entities/waste-disposal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CarbonFootprint, Purchase, WasteDisposal])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}