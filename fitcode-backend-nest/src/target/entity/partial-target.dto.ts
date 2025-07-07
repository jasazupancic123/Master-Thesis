import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Target } from './target.entity';
import { PickType } from '@nestjs/mapped-types';

export class PartialTarget extends PickType(Target, ['componentId'] as const) {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  targetId: string;
}
