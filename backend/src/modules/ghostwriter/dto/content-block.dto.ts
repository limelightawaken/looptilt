import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockKind } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateContentBlockDto {
  @ApiPropertyOptional({ enum: ContentBlockKind, default: ContentBlockKind.CONTENT })
  @IsOptional()
  @IsEnum(ContentBlockKind)
  kind?: ContentBlockKind;

  @ApiProperty({ example: 'Lead story: the retention cliff' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ example: 'Hook the reader with a contrarian stat about churn' })
  @IsOptional()
  @IsString()
  intent?: string;

  @ApiPropertyOptional({ example: 'Most creators watch open rate. The number that predicts churn is the slope...' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Link, image, or promotion URL', example: 'https://example.com/post' })
  @IsOptional()
  @IsString()
  url?: string;

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
  @ApiPropertyOptional({ enum: ContentBlockKind })
  @IsOptional()
  @IsEnum(ContentBlockKind)
  kind?: ContentBlockKind;

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
  url?: string;

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
