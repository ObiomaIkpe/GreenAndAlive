import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { User } from '../users/entities/user.entity';
import { CarbonFootprint } from '../carbon/entities/carbon-footprint.entity';
import { CarbonCredit } from '../marketplace/entities/carbon-credit.entity';
import { Purchase } from '../marketplace/entities/purchase.entity';
import { AiRecommendation } from '../ai/entities/ai-recommendation.entity';
import { BlockchainTransaction } from '../blockchain/entities/blockchain-transaction.entity';
import { VerificationRequest } from '../verification/entities/verification-request.entity';
import { CorporateProfile } from '../corporate/entities/corporate-profile.entity';
import { WasteDisposal } from '../waste/entities/waste-disposal.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'carbonai'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME', 'carbonai_db'),
        entities: [
          User,
          UserPreferences,
          CarbonFootprint,
          CarbonCredit,
          Purchase,
          AiRecommendation,
          BlockchainTransaction,
          VerificationRequest,
          CorporateProfile,
          WasteDisposal,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class DatabaseModule {}