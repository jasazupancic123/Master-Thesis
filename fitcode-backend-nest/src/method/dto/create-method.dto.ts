import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { Method } from '../entity/method.entity';
import { IdEntity } from 'src/common/entity/id.entity';

export class CreateMethodDto extends PickType(Method, [
  'name',
  'targetId',
  'ability',
  'repetition',
  'intensity',
  'set',
  'tempo',
  'recovery',
]) {}

export class CreateMethodWithIdDto extends IntersectionType(
  IdEntity,
  CreateMethodDto,
) {}
