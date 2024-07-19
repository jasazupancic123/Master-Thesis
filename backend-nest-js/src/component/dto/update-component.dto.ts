import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { ComponentDto } from './component.dto';

export class UpdateComponentDto extends PartialType(PickType(ComponentDto, ['name'] as const)) {}