import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { DataSource } from '@prisma/client';

export class ConnectEspDto {
  @ApiProperty({
    enum: DataSource,
    description: 'LIVE_KIT uses the real Kit account; SIMULATOR uses local demo data.',
  })
  @IsEnum(DataSource)
  dataSource: DataSource;

  @ApiPropertyOptional({
    description: 'Kit v4 API key. Required when dataSource is LIVE_KIT.',
  })
  @ValidateIf((dto: ConnectEspDto) => dto.dataSource === 'LIVE_KIT')
  @IsString()
  apiKey?: string;
}
