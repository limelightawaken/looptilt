import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { NewslettersModule } from './modules/newsletters/newsletters.module';
import { FingerprintsModule } from './modules/fingerprints/fingerprints.module';
import { GhostwriterModule } from './modules/ghostwriter/ghostwriter.module';
import { UsersModule } from './modules/users/users.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    NewslettersModule,
    FingerprintsModule,
    GhostwriterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
