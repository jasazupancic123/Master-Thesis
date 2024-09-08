import { Component } from '../entity/component.entity';
import { PickType } from '@nestjs/mapped-types';

export class CreateComponentDto extends PickType(Component, ['name', 'parent'] as const) {
}