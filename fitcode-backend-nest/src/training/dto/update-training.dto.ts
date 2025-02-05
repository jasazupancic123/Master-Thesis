import { UpdateTraining } from '../type/training.type';
import { DateFilterDto } from '../../common/dto/date-filter.dto';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TrainingComponent } from '../entity/training-component.entity';

export class UpdateTrainingDto extends DateFilterDto implements UpdateTraining {
  @IsObject()
  @IsOptional()
  @Expose()
  components?: { [componentId: string]: TrainingComponent };
}

export class UpdateTrainingsDto {
  @ValidateNested({ each: true })
  @Type(() => UpdateTrainingDto)
  @ApiProperty()
  @Expose()
  trainings: UpdateTrainingDto[];
}

const a: UpdateTrainingsDto = {
  trainings: [{}],
};
