import { IntersectionType } from '@nestjs/mapped-types';

import { IdEntity } from './id.entity';
import { TimestampEntity } from './timestamp.entity';

export class BaseEntity extends IntersectionType(IdEntity, TimestampEntity) {}
