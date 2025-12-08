import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../../config/auth.config';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [BetterAuthModule.forRoot({ auth }), DatabaseModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
