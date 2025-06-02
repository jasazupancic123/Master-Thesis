import { PickType } from '@nestjs/mapped-types';
import { Method } from '../entity/method.entity';

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

export class CreateMethodWithIdDto extends PickType(Method, [
  'id',
  'name',
  'targetId',
  'ability',
  'repetition',
  'intensity',
  'set',
  'tempo',
  'recovery',
]) {}
