import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { DateRangeDto } from 'src/common/dto/date-range.dto';

export class CopyComponentDto extends PickType(DateRangeDto, [
  'from',
] as const) {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  copyFromTrainingId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  copyToTrainingId?: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentId: string;
}
