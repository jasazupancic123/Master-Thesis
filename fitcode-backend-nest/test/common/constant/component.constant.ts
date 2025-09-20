import type { Component } from '@src/component/entity/component.entity';

import { ATTRIBUTE_ENDURANCE_OPTIONS } from './attribute.constant';

export const COMPONENT_ENDURANCE: Omit<Component, 'children' | 'parents'> & {
  children: Component[];
} = {
  id: 'endurance',
  parentId: null,
  name: 'Endurance',
  slug: 'endurance',
  targets: [
    {
      id: 'aerobic-power',
      name: 'Aerobic Power',
      componentId: 'endurance',
      color: '#9a73e0',
    },
    {
      id: 'anaerobic-power',
      name: 'Anaerobic Power',
      componentId: 'endurance',
      color: '#4a78cc',
    },
    {
      id: 'aerobic-capacity',
      name: 'Aerobic Capacity',
      componentId: 'endurance',
      color: '#bb9d4e',
    },
    {
      id: 'anaerobic-capacity',
      name: 'Anaerobic Capacity',
      componentId: 'endurance',
      color: '#1136cf',
    },
    {
      id: 'lactic-anaerobic',
      name: 'Lactic Anaerobic',
      componentId: 'endurance',
      color: '#f5a4c3',
    },
    {
      id: 'alactic-anaerobic',
      name: 'Alactic Anaerobic',
      componentId: 'endurance',
      color: '#2b1af9',
    },
  ],
  params: {
    default: [
      {
        field: 'vol1',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'int1',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
    ],
    'end-opts:selected:end-opt-2': [
      {
        field: 'volWorkSets',
        defaultValue: 'set',
        options: [{ field: 'set', defaultValue: '3' }],
      },
      {
        field: 'vol1',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'int1',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
      {
        field: 'volRec',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'intRec',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
    ],
    'end-opts:selected:end-opt-3': [
      {
        field: 'volWorkSets',
        defaultValue: 'set',
        options: [{ field: 'set', defaultValue: '3' }],
      },
      {
        field: 'vol1',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'vol2',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'int1',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
      {
        field: 'int2',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
      {
        field: 'volRec',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'intRec',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
    ],
    'end-opts:selected:end-opt-4': [
      {
        field: 'volWorkSets',
        defaultValue: 'set',
        options: [{ field: 'set', defaultValue: '3' }],
      },
      {
        field: 'vol1',
        defaultValue: 'rep',
        options: [{ field: 'rep', defaultValue: '12' }],
      },
      {
        field: 'vol2',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'int2',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
      {
        field: 'volRec',
        defaultValue: 'time',
        options: [
          { field: 'time', defaultValue: '60' },
          { field: 'dist', defaultValue: '50' },
        ],
      },
      {
        field: 'intRec',
        defaultValue: 'eff',
        options: [
          { field: 'mas', defaultValue: '100' },
          { field: 'hrmax', defaultValue: '100' },
          { field: 'eff', defaultValue: '1' },
        ],
      },
    ],
  },
  children: [
    {
      id: 'aerobic-capacity',
      parentId: 'endurance',
      targets: [],
      name: 'Aerobic Capacity',
      slug: 'aerobic-capacity',
      attributes: [ATTRIBUTE_ENDURANCE_OPTIONS.field],
      children: [],
    },
    {
      id: 'aerobic-power',
      parentId: 'endurance',
      targets: [],
      name: 'Aerobic Power',
      slug: 'aerobic-power',
      attributes: [ATTRIBUTE_ENDURANCE_OPTIONS.field],
      children: [],
    },
    {
      id: 'anaerobic-capacity',
      parentId: 'endurance',
      targets: [],
      name: 'Anaerobic Capacity',
      slug: 'anaerobic-capacity',
      attributes: [ATTRIBUTE_ENDURANCE_OPTIONS.field],
      children: [],
    },
    {
      id: 'anaerobic-power',
      parentId: 'endurance',
      targets: [],
      name: 'Anaerobic Power',
      slug: 'anaerobic-power',
      attributes: [ATTRIBUTE_ENDURANCE_OPTIONS.field],
      children: [],
    },
  ],
};
