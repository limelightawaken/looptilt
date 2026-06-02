import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateContentBlockDto {
  @ApiProperty({ example: 'Lead story: the retention cliff' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'Hook the reader with a contrarian stat about churn' })
  @IsString()
  @IsNotEmpty()
  intent: string;

  @ApiProperty({ example: 'Most creators watch open rate. The number that predicts churn is the slope...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Associated topic id (for affinity-aware ordering)' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateContentBlockDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  intent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
