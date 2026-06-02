import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EspProvider } from '@prisma/client';

export class UpdateNewsletterDto {
  @ApiPropertyOptional({ example: 'The Growth Brief' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: EspProvider })
  @IsOptional()
  @IsEnum(EspProvider)
  espProvider?: EspProvider;
}
