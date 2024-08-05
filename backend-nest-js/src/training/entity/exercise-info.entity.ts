import { BaseEntity } from '../../common/entity/base.entity';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Entity } from '../../common/decorator/entity.decorator';
import { EXERCISE_INFO_COLLECTION } from '../../common/const/firestore.const';

@Entity(EXERCISE_INFO_COLLECTION)
export class ExerciseInfoEntity extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  superExerciseInfoId: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  value: number; // kilograms
}