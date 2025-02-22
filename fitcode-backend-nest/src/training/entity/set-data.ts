import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsStringOrNumber } from 'src/common/decorator/is-string-or-number.decorator';
import { SetStatus } from '../enum/set-status.enum';

export class SetData {
  @IsEnum(SetStatus)
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  status: SetStatus;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  setTypeValue?: number; // actual user reps / distance / time / ... completed

  @IsStringOrNumber()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  workloadValue?: string | number; // actual user kg completed

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;
}
