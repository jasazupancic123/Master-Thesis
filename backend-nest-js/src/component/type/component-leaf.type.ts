import { Component } from '../entity/component.entity';

export type ComponentLeaf = Component & { parents: Component[] };