import { PickType } from '@nestjs/mapped-types';
import { Institution } from '../entity/institution.entity';

export class CreateInstitutionDto extends PickType(Institution, [
  'ownerId',
  'name',
  'imageUrl',
] as const) {}
