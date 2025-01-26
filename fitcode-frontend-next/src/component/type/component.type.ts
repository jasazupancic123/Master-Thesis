import { Component } from '@/component/entity/component.entity';

export type TreeComponent = Omit<Component, 'children'> & { children: TreeComponent[] };

export type CreateComponent = Pick<Component, 'name' | 'parent'>;