import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Entity } from '../../common/decorator/entity.decorator';
import { EXERCISE_COLLECTION } from '../../common/const/firestore.const';
import { BaseEntity } from '../../common/entity/base.entity';

@Entity(EXERCISE_COLLECTION)
export class Exercise extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @ApiProperty()
  componentIds: string[];

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  global: boolean;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  videoUrl?: string;

  attributeValues: Record<string, any>;
  components: string[];
}
