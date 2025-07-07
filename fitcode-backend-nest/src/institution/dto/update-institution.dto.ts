import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateInstitutionDto } from './create-institution.dto';

export class UpdateInstitutionDto extends PartialType(
  PickType(CreateInstitutionDto, ['name', 'imageUrl'] as const),
) {}
