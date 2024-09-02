import { IsDate, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Group } from './group.entity';
import { Training } from '../../training/entity/training.entity';
import { Entity } from '../../common/decorator/entity.decorator';
import { BaseEntity } from '../../common/entity/base.entity';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

export interface Week {
  date: Date;
}

@Entity(FirestoreCollection.CYCLE)
export class Cycle extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  groupId: string; // group the cycle belongs to

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  // relations
  group: Group;
  trainings: Training[];
  weeks: Week[][];
}