import { Component } from '../entity/component.entity';

export const WARMUP_COMPONENT_ID = 'warmup';
export const COOLDOWN_COMPONENT_ID = 'cooldown';

export const WARMUP_COMPONENT: Component = {
  id: WARMUP_COMPONENT_ID,
  name: 'Warmup',
  parentId: null,
  slug: 'warmup',
  targets: [],
  attributes: [
    'pattern',
    'loadingSide',
    'movDir',
    'coeff',
    'method',
    'prescr',
    'priority',
    'sportTask',
  ],
};

export const COOLDOWN_COMPONENT: Component = {
  id: COOLDOWN_COMPONENT_ID,
  name: 'Cooldown',
  parentId: null,
  slug: 'Cooldown',
  targets: [],
  attributes: [
    'pattern',
    'loadingSide',
    'movDir',
    'coeff',
    'method',
    'prescr',
    'priority',
    'sportTask',
  ],
};
