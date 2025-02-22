import { PickType } from '@nestjs/mapped-types';
import { Component } from '../entity/component.entity';

export class CreateComponentDto extends PickType(Component, [
  'name',
  'parent',
] as const) {}
