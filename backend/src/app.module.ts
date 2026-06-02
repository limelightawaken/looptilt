import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { NewslettersModule } from './modules/newsletters/newsletters.module';
import { FingerprintsModule } from './modules/fingerprints/fingerprints.module';
import { GhostwriterModule } from './modules/ghostwriter/ghostwriter.module';
import { EspModule } from './modules/esp/esp.module';
import { SignalsModule } from './modules/signals/signals.module';
import { ReaderFingerprintsModule } from './modules/reader-fingerprints/reader-fingerprints.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { LoopModule } from './modules/loop/loop.module';
import { SendsModule } from './modules/sends/sends.module';
import { UsersModule } from './modules/users/users.module';
import appConfig from './config/app.config';
import aiConfig from './config/ai.config';
import espConfig from './config/esp.config';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, aiConfig, espConfig, databaseConfig],
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    DatabaseModule,
    CryptoModule,
    AiModule,
    HealthModule,
    AuthModule,
    UsersModule,
    NewslettersModule,
    FingerprintsModule,
    GhostwriterModule,
    EspModule,
    SignalsModule,
    ReaderFingerprintsModule,
    SegmentsModule,
    LoopModule,
    SendsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
