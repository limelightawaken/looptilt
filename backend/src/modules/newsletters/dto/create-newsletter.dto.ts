import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EspProvider } from '@prisma/client';

export class CreateNewsletterDto {
  @ApiProperty({ example: 'The Growth Brief' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Weekly insights on newsletter growth and retention.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: EspProvider, default: EspProvider.NONE })
  @IsOptional()
  @IsEnum(EspProvider)
  espProvider?: EspProvider;
}
