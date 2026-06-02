import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class SeedSubscribersDto {
  @ApiPropertyOptional({ default: 60, minimum: 1, maximum: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  subscriberCount?: number;
}

export class GenerateSignalsDto {
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  issues?: number;
}
