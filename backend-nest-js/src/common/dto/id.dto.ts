import { PickType } from '@nestjs/mapped-types';
import { BaseEntity } from '../entity/base.entity';

export class IdDto extends PickType(BaseEntity, ['id'] as const) {
}