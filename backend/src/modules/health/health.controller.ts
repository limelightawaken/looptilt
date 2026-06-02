import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { HealthService } from './health.service';

@ApiTags('health')
@AllowAnonymous()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  check() {
    return this.healthService.check();
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Report AI provider and per-data-source connection counts' })
  @ApiResponse({ status: 200, description: 'Readiness details' })
  readiness() {
    return this.healthService.readiness();
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connection health' })
  @ApiResponse({ status: 200, description: 'Database is connected' })
  @ApiResponse({ status: 503, description: 'Database connection failed' })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
