import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BatchOperation } from '@src/common/type/orm.type';
import { Training } from '@src/training/entity/training.entity';

import { Group } from '../entity/group.entity';
import { Institution } from '../entity/institution.entity';
import { InstitutionMember } from '../entity/institution-member.entity';

export class UpdateInstitutionAthleteEvent {
  @Expose()
  operations: BatchOperation<
    InstitutionMember | Institution | Group | Training
  >[];

  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  institutionId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  groupId?: string;

  @IsBoolean()
  @Expose()
  add?: boolean;

  constructor(obj: UpdateInstitutionAthleteEvent) {
    this.operations = obj.operations;
    this.userId = obj.userId;
    this.institutionId = obj.institutionId;
    this.groupId = obj.groupId;
    this.add = obj.add;
  }
}
