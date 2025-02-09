import { PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { CreateTraining } from '../type/training.type';
import { ApiProperty, OmitType } from '@nestjs/swagger';

export class CreateTrainingDto
  extends PickType(Training, ['groupId', 'cycleId', 'from', 'to', 'components'])
  implements Omit<CreateTraining, 'ownerId' | 'copiedFromId' | 'membersIds'> {}
