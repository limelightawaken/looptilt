import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGhostwriterDraftDto {
  @ApiProperty({ example: 'Issue #47 — The retention cliff nobody talks about' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: ['Hook: open with a contrarian stat', 'Section 1: why averages hide churn', 'Close: one action for this week'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  outline?: string[];

  @ApiPropertyOptional({
    example: 'Focus this issue on readers who prefer quick tactical takeaways over deep theory.',
  })
  @IsOptional()
  @IsString()
  brief?: string;
}
