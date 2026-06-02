import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSendDto {
  @ApiProperty({ example: 'Issue #48 - the retention cliff' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;
}
