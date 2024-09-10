import { Component } from '@/component/entity/component.entity';

export type CreateComponent = Pick<Component, 'name' | 'parent'>;