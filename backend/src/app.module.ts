import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CarbonModule } from './carbon/carbon.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AiModule } from './ai/ai.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { VerificationModule } from './verification/verification.module';
import { CorporateModule } from './corporate/corporate.module';
import { WasteModule } from './waste/waste.module';
import { AnalyticsModule } from './analytics/analytics.module';

// Shared modules
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL', 60) * 1000,
          limit: configService.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Caching
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('CACHE_TTL', 300) * 1000,
        max: 100,
      }),
      isGlobal: true,
    }),

    // Database
    DatabaseModule,

    // Feature modules
    CommonModule,
    AuthModule,
    UsersModule,
    CarbonModule,
    MarketplaceModule,
    AiModule,
    BlockchainModule,
    VerificationModule,
    CorporateModule,
    WasteModule,
    AnalyticsModule,
  ],
})
export class AppModule {}