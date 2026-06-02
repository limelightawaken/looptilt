import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PreviewSegmentDto {
  @ApiProperty({
    example: 'readers who used to open everything but cooled off and lean technical',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

class SegmentConditionDto {
  @ApiProperty({ enum: ['topicAffinity', 'lifecycleStage', 'churnPropensity', 'depthPreference', 'acquisitionChannel'] })
  @IsIn(['topicAffinity', 'lifecycleStage', 'churnPropensity', 'depthPreference', 'acquisitionChannel'])
  field: 'topicAffinity' | 'lifecycleStage' | 'churnPropensity' | 'depthPreference' | 'acquisitionChannel';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicName?: string;

  @ApiProperty({ enum: ['gte', 'lte', 'eq', 'neq'] })
  @IsIn(['gte', 'lte', 'eq', 'neq'])
  operator: 'gte' | 'lte' | 'eq' | 'neq';

  @ApiProperty()
  value: string | number;
}

class SegmentRuleDto {
  @ApiProperty({ enum: ['all', 'any'] })
  @IsIn(['all', 'any'])
  match: 'all' | 'any';

  @ApiProperty({ type: [SegmentConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentConditionDto)
  conditions: SegmentConditionDto[];
}

export class CreateSegmentDto {
  @ApiProperty({ example: 'Cooling technical readers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rationale?: string;

  @ApiProperty({ type: SegmentRuleDto })
  @ValidateNested()
  @Type(() => SegmentRuleDto)
  rule: SegmentRuleDto;
}
