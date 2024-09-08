import { TimestampEntity } from './timestamp.entity';
import { IntersectionType } from '@nestjs/mapped-types';
import { IdEntity } from './id.entity';

export class BaseEntity extends IntersectionType(IdEntity, TimestampEntity) {
}