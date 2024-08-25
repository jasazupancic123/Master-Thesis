import { PartialType, PickType } from '@nestjs/mapped-types';
import { Component } from '../entity/component.entity';

export class UpdateComponentDto extends PartialType(PickType(Component, ['name'] as const)) {
}