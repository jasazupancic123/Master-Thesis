import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Wellness } from '../entity/wellness.entity';

export class CreateWellnessDto extends OmitType(PartialType(Wellness), ['date'] as const) {
}