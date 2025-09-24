import type { Attribute } from '@src/attribute/entity/attribute.entity';

export const Category: Attribute[] = [
  {
    field: 'strength',
    name: 'Strength',
    options: [
      { field: 'other', name: 'Other' },
      {
        field: 'power',
        name: 'Power',
        options: [
          { field: 'olympic-lifts', name: 'Olympic Lifts' },
          { field: 'fast-general', name: 'Fast General' },
          { field: 'jumping', name: 'Jumping' },
          { field: 'throwing', name: 'Throwing' },
          { field: 'running-based', name: 'Running Based' },
          { field: 'reactive', name: 'Reactive' },
          { field: 'explosive', name: 'Explosive' },
          { field: 'braking', name: 'Braking' },
        ],
      },
      {
        field: 'general',
        name: 'General Strength',
        options: [
          { field: 'concentric', name: 'Concentric' },
          { field: 'eccentric', name: 'Eccentric' },
          { field: 'isometric', name: 'Isometric' },
          { field: 'con-ecc', name: 'Con-Ecc' },
        ],
      },
      {
        field: 'corrective',
        name: 'Corrective',
        options: [
          { field: 'spine', name: 'Spine' },
          { field: 'hip', name: 'Hip' },
          { field: 'shoulder', name: 'Shoulder' },
          { field: 'ankle', name: 'Ankle' },
          { field: 'knee', name: 'Knee' },
        ],
      },
    ],
  },
  {
    field: 'speed',
    name: 'Speed',
    options: [
      {
        field: 'acceleration',
        name: 'Acceleration',
        options: [
          {
            name: 'Generic',
            field: 'generic',
            options: [
              {
                name: 'Resisted',
                field: 'resisted',
                options: [],
              },
              {
                name: 'Assisted',
                field: 'assisted',
                options: [],
              },
            ],
          },
          {
            name: 'Game Specific',
            field: 'game-specific',
            options: [],
          },
          {
            name: 'Hybrid',
            field: 'hybrid',
            options: [],
          },
        ],
      },
      {
        name: 'Deceleration',
        field: 'deceleration',
        attributes: [
          'location',
          'pattern',
          'loadingSide',
          'movDir',
          'coeff',
          'method',
          'prescr',
          'sportTask',
        ],
        options: [
          {
            name: 'Generic',
            field: 'generic',
            options: [
              {
                name: 'Resisted',
                field: 'resisted',
                options: [],
              },
              {
                name: 'Assisted',
                field: 'assisted',
                options: [],
              },
            ],
          },
          {
            name: 'Game Specific',
            field: 'game-specific',
            options: [],
          },
          {
            name: 'Hybrid',
            field: 'hybrid',
            options: [],
          },
        ],
      },
      {
        name: 'Peak Speed',
        field: 'peak-speed',
        attributes: [
          'location',
          'pattern',
          'loadingSide',
          'movDir',
          'coeff',
          'method',
          'prescr',
          'sportTask',
        ],
        options: [
          {
            name: 'Generic',
            field: 'generic',
            options: [
              {
                name: 'Resisted',
                field: 'resisted',
                options: [],
              },
              {
                name: 'Assisted',
                field: 'assisted',
                options: [],
              },
            ],
          },
          {
            name: 'Game Specific',
            field: 'game-specific',
            options: [],
          },
          {
            name: 'Hybrid',
            field: 'hybrid',
            options: [],
          },
        ],
      },
      {
        name: 'COD',
        field: 'cod',
        attributes: [
          'location',
          'pattern',
          'loadingSide',
          'movDir',
          'coeff',
          'method',
          'prescr',
          'sportTask',
        ],
        options: [
          {
            name: 'Generic',
            field: 'generic',
            options: [
              {
                name: 'Resisted',
                field: 'resisted',
                options: [],
              },
              {
                name: 'Assisted',
                field: 'assisted',
                options: [],
              },
            ],
          },
          {
            name: 'Game Specific',
            field: 'game-specific',
            options: [],
          },
          {
            name: 'Hybrid',
            field: 'hybrid',
            options: [],
          },
        ],
      },
      {
        name: 'Agility',
        field: 'agility',
        attributes: [
          'location',
          'pattern',
          'loadingSide',
          'movDir',
          'coeff',
          'method',
          'prescr',
          'sportTask',
        ],
        options: [
          {
            name: 'Generic',
            field: 'generic',
            options: [
              {
                name: 'Resisted',
                field: 'resisted',
                options: [],
              },
              {
                name: 'Assisted',
                field: 'assisted',
                options: [],
              },
            ],
          },
          {
            name: 'Game Specific',
            field: 'game-specific',
            options: [],
          },
          {
            name: 'Hybrid',
            field: 'hybrid',
            options: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Endurance',
    field: 'endurance',
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
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'int1',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
      ],
      'end-opts:selected:end-opt-2': [
        {
          field: 'volWorkSets',
          defaultValue: 'set',
          options: [{ field: 'set' }],
        },
        {
          field: 'vol1',
          defaultValue: 'time',
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'int1',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
        {
          field: 'volRec',
          defaultValue: 'time',
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'intRec',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
      ],
      'end-opts:selected:end-opt-3': [
        {
          field: 'volWorkSets',
          defaultValue: 'set',
          options: [{ field: 'set' }],
        },
        {
          field: 'vol1',
          defaultValue: 'time',
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'vol2',
          defaultValue: 'time',
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'int1',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
        {
          field: 'int2',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
        {
          field: 'volRec',
          defaultValue: 'time',
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'intRec',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
      ],
      'end-opts:selected:end-opt-4': [
        {
          field: 'volWorkSets',
          defaultValue: 'set',
          options: [{ field: 'set' }],
        },
        {
          field: 'vol1',
          defaultValue: 'rep',
          options: [{ field: 'rep' }],
        },
        {
          field: 'vol2',
          defaultValue: 'time',
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'int2',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
        {
          field: 'volRec',
          defaultValue: 'time',
          options: [{ field: 'time' }, { field: 'dist' }],
        },
        {
          field: 'intRec',
          defaultValue: 'eff',
          options: [{ field: 'mas' }, { field: 'hrmax' }, { field: 'eff' }],
        },
      ],
    },
    options: [
      {
        name: 'Aerobic Capacity',
        field: 'aerobic-capacity',
        attributes: ['pattern', 'coeff', 'method', 'sportTask', 'end-opts'],
        options: [],
      },
      {
        name: 'Aerobic Power',
        field: 'aerobic-power',
        attributes: ['pattern', 'coeff', 'method', 'sportTask', 'end-opts'],
        options: [],
      },
      {
        name: 'Anaerobic Capacity',
        field: 'anaerobic-capacity',
        attributes: ['pattern', 'coeff', 'method', 'sportTask', 'end-opts'],
        options: [],
      },
      {
        name: 'Anaerobic Power',
        field: 'anaerobic-power',
        attributes: ['pattern', 'coeff', 'method', 'sportTask', 'end-opts'],
        options: [],
      },
    ],
  },
  {
    name: 'Coordination',
    field: 'coordination',
    attributes: [],
    params: [],
    options: [
      {
        name: 'Technical Work',
        field: 'technical-work',
        options: [],
      },
      {
        name: 'Running Mechanics',
        field: 'running-mechanics',
        options: [],
      },
      {
        name: 'Jumping / Landing',
        field: 'jumping-landing',
        options: [],
      },
      {
        name: 'Orientation',
        field: 'orientation',
        options: [],
      },
      {
        name: 'Dissociation',
        field: 'dissociation',
        options: [],
      },
      {
        name: 'Balance',
        field: 'balance',
        options: [],
      },
      {
        name: 'Foot Alignment',
        field: 'foot-alignment',
        options: [],
      },
      {
        name: 'Reaction',
        field: 'reaction',
        options: [],
      },
      {
        name: 'Breathing',
        field: 'breathing',
        options: [],
      },
    ],
  },
  {
    name: 'ROM',
    field: 'rom',
    targets: [
      {
        id: 'flexibility',
        name: 'Flexibility',
        componentId: 'rom',
        color: '#d2ee2d',
      },
      {
        id: 'mobility',
        name: 'Mobility',
        componentId: 'rom',
        color: '#d87d40',
      },
    ],
    params: {
      default: [
        {
          field: 'vol',
          defaultValue: 'rep',
          options: [{ field: 'rep' }, { field: 'time' }],
        },
        {
          field: 'volRec',
          defaultValue: 'time',
          options: [{ field: 'time' }],
        },
      ],
    },
    options: [
      {
        name: 'Flexibility',
        field: 'flexibility',
        attributes: ['location', 'diagnosis', 'muscle'],
        options: [
          {
            name: 'Ballistic Stretching',
            field: 'ballistic-stretching',
            options: [],
          },
          {
            name: 'Dynamic Stretching',
            field: 'dynamic-stretching',
            options: [],
          },
          {
            name: 'Active Stretching',
            field: 'active-stretching',
            options: [],
          },
          {
            name: 'Passive Stretching',
            field: 'passive-stretching',
            options: [],
          },
          {
            name: 'Static Stretching',
            field: 'static-stretching',
            options: [],
          },
          {
            name: 'Isometric Stretching',
            field: 'isometric-stretching',
            options: [],
          },
          {
            name: 'PNF Stretching',
            field: 'pnf-stretching',
            options: [],
          },
        ],
      },
      {
        name: 'Mobility',
        field: 'mobility',
        attributes: ['location', 'diagnosis', 'muscle'],
        options: [
          {
            name: 'Dynamic WU',
            field: 'dynamic-wu',
            options: [],
          },
          {
            name: 'WOD',
            field: 'wod',
            options: [],
          },
          {
            name: 'Use Of Load',
            field: 'use-of-load',
            options: [],
          },
          {
            name: 'Exercise ROM',
            field: 'exercise-rom',
            options: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Competition',
    field: 'competition',
    targets: [
      {
        id: 'not-important',
        name: 'NI',
        componentId: 'competition',
        color: '#d2ee2d',
      },
      {
        id: 'important',
        name: 'I',
        componentId: 'competition',
        color: '#d87d40',
      },
      {
        id: 'very-important',
        name: 'VI',
        componentId: 'competition',
        color: '#f02846',
      },
    ],
    params: { default: [] },
    options: [],
  },
];
