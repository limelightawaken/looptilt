import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AddArchiveIssueDto {
  @ApiProperty({ example: 'Why your open rate is lying to you' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Full issue body text pasted from your archive...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: '2025-11-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
