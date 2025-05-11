import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { validationSchema } from '../../config/environment-validation-schema';
import { TrainingPlanService } from './training-plan.service';
import { ComponentService } from '../../component/component.service';
import { generateComponentStub } from '../../component/mock/component.stub';
import { generateAttributeStub } from '../../attribute/mock/attribute.stub';
import { generateExerciseStub } from '../../exercise/mock/exercise.stub';
import { generateExerciseAttributeValueStub } from '../../attribute/mock/attribute-value.stub';
import {
  IntType,
  ParamType,
  VolWorkSetType,
} from '../../component/enum/param.enum';
import {
  DEFAULT_PARAMS_KEY,
  PARAMS,
  VOL_WORK_SET_OPTIONS,
} from '../../component/constant/param.constant';
import {
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '../mock/training.stub';
import { AttributeType } from '../../common/enum/attribute-type.enum';
import { ComponentParam } from '../../component/entity/component-param.entity';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { createMock } from '@golevelup/ts-jest';
import { AttributeService } from '../../attribute/service/attribute.service';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { ExerciseAttributeValueRepository } from '../../exercise/repository/exercise-attribute-value.repository';
import { AttributeRepository } from '../../attribute/repository/attribute.repository';
import {
  COOLDOWN_COMPONENT,
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';
import { addMinutes, subMinutes } from 'date-fns';

describe('TrainingPlanService (unit)', () => {
  let service: TrainingPlanService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema }),
        CommonModule,
      ],
      providers: [
        {
          provide: AttributeRepository,
          useValue: createMock<AttributeRepository>(),
        },
        AttributeService,
        {
          provide: ComponentService,
          useValue: createMock<ComponentService>(),
        },
        {
          provide: ExerciseService,
          useValue: createMock<ExerciseService>(),
        },
        {
          provide: ExerciseAttributeValueRepository,
          useValue: createMock<ExerciseAttributeValueRepository>(),
        },
        TrainingPlanService,
      ],
    }).compile();

    service = moduleRef.get(TrainingPlanService);
    componentService = moduleRef.get(ComponentService);
    exerciseService = moduleRef.get(ExerciseService);
  });

  it('should find all training exercises', async () => {
    exerciseService.findAllByIds = jest
      .fn()
      .mockReturnValueOnce([
        generateExerciseStub({ id: 'e1' }),
        generateExerciseStub({ id: 'e2' }),
        generateExerciseStub({ id: 'e3' }),
        generateExerciseStub({ id: 'e4' }),
        generateExerciseStub({ id: 'e5' }),
      ]);

    const trainingExercises = [
      generateTrainingExercise({ id: 'e1' }),
      generateTrainingExercise({ id: 'e2' }),
      generateTrainingExercise({ id: 'e3' }),
      generateTrainingExercise({ id: 'e4' }),
      generateTrainingExercise({ id: 'e5' }),
    ];

    // both components have 3 exercises and the middle one is overlapping
    const trainingComponents = [
      generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              trainingExercises[0],
              trainingExercises[1],
              trainingExercises[2],
            ],
          }),
        ],
      }),
      generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              trainingExercises[2],
              trainingExercises[3],
              trainingExercises[4],
            ],
          }),
        ],
      }),
    ];

    const result = await service.findAllTrainingExercises(
      undefined,
      trainingComponents,
    );

    expect(result).toHaveLength(5);
    expect(result).toEqual([
      expect.objectContaining({ id: 'e1' }),
      expect.objectContaining({ id: 'e2' }),
      expect.objectContaining({ id: 'e3' }),
      expect.objectContaining({ id: 'e4' }),
      expect.objectContaining({ id: 'e5' }),
    ]);
  });

  describe('validateTrainingComponents', () => {
    const components = [
      WARMUP_COMPONENT,
      generateComponentStub({ id: 'c1', name: 'Component 1' }),
      generateComponentStub({ id: 'c2', name: 'Component 2' }),
      generateComponentStub({ id: 'c3', name: 'Component 3' }),
      generateComponentStub({ id: 'c4' }),
      generateComponentStub({ id: 'c5' }),
      generateComponentStub({ id: 'c6' }),
      generateComponentStub({ id: 'leaf1', parentId: 'c1', name: 'Leaf 1' }),
      generateComponentStub({ id: 'leaf2', parentId: 'c1', name: 'Leaf 2' }),
      generateComponentStub({ id: 'leaf3', parentId: 'c2', name: 'Leaf 3' }),
      COOLDOWN_COMPONENT,
    ];

    const exercises = [
      generateExerciseStub({ id: 'e1', componentIds: ['leaf1'] }),
      generateExerciseStub({ id: 'e2', componentIds: ['leaf1'] }),
      generateExerciseStub({ id: 'e3', componentIds: ['leaf2'] }),
      generateExerciseStub({ id: 'e4', componentIds: ['leaf3'] }),
      generateExerciseStub({ id: 'e5', componentIds: ['leaf3'] }),
    ];

    beforeEach(() => {
      jest
        .spyOn(componentService, 'leafsFromFlat')
        .mockReturnValue(components.filter((c) => c.id.includes('leaf')));

      jest
        .spyOn(componentService, 'getRoot')
        .mockImplementation((leaf, allComponents) => {
          return allComponents.find((c) => c.id === leaf.parentId) || leaf;
        });
    });

    it('should throw error if there is no warmup component', () => {
      const trainingComponents = [generateTrainingComponent({ id: 'c1' })];

      expect(() =>
        service.validateTrainingComponents(
          [],
          [],
          trainingComponents,
          components,
        ),
      ).toThrow('Training must have warmup component');
    });

    it('should throw error if there is no cooldown component', () => {
      const trainingComponents = [
        generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
        generateTrainingComponent({ id: 'c1' }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          [],
          trainingComponents,
          components,
        ),
      ).toThrow('Training must have cooldown component');
    });

    it('should throw error if component does not exist', () => {
      const trainingComponents = [
        generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
        generateTrainingComponent({ id: 'invalid-component-id' }),
        generateTrainingComponent({ id: COOLDOWN_COMPONENT_ID }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          [],
          trainingComponents,
          components,
        ),
      ).toThrow('Component does not exist');
    });

    it('should throw error if component is not root', () => {
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({ id: 'leaf1', from: now }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 5),
        }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          [],
          trainingComponents,
          components,
        ),
      ).toThrow(`Component Leaf 1 cannot be selected for training`);
    });

    it('should throw error if there are duplicate components', () => {
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({ id: 'c1', from: now }),
        generateTrainingComponent({ id: 'c2', from: addMinutes(now, 5) }),
        generateTrainingComponent({ id: 'c3', from: addMinutes(now, 10) }),
        generateTrainingComponent({ id: 'c1', from: addMinutes(now, 15) }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 20),
        }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          [],
          trainingComponents,
          components,
        ),
      ).toThrow(`Duplicate component Component 1`);
    });

    it('should throw error if component times are invalid', () => {
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({ id: 'c1', from: now }),
        generateTrainingComponent({ id: 'c2', from: now }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 20),
        }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          [],
          trainingComponents,
          components,
        ),
      ).toThrow(`Component Component 1 has to start before Component 2`);
    });

    it('should throw error if wrong exercises is provided', () => {
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({
          id: 'c1',
          from: now,
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'e1' }), // leaf1 -> c1
                generateTrainingExercise({ id: 'e2' }), // leaf1 -> c1
                generateTrainingExercise({ id: 'e4' }), // leaf3 -> c2, NOT ALLOWED
              ],
            }),
          ],
        }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 5),
        }),
      ];

      const exercise = exercises.find((e) => e.id === 'e4');

      expect(() =>
        service.validateTrainingComponents(
          exercises.filter((e) => ['e1', 'e2', 'e4'].includes(e.id)),
          [],
          trainingComponents,
          components,
        ),
      ).toThrow(
        `Exercise ${exercise?.name} cannot be part of selected component`,
      );
    });

    it('should throw error if there is an invalid member in subgroup', () => {
      const memberIds = ['m1', 'm2', 'm3'];
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({
          id: 'c1',
          from: now,
          subgroups: [
            generateSubgroup({ membersIds: ['m1', 'm2'] }),
            generateSubgroup({ membersIds: ['m3'] }),
            generateSubgroup({ membersIds: ['invalid-member'] }),
          ],
        }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 5),
        }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          memberIds,
          trainingComponents,
          components,
        ),
      ).toThrow('Invalid member');
    });

    it('should throw error if some member is in multiple subgroups simultaneously', () => {
      const memberIds = ['m1', 'm2', 'm3'];
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({
          id: 'c1',
          from: now,
          subgroups: [
            generateSubgroup({ membersIds: ['m1', 'm2'] }),
            generateSubgroup({ membersIds: ['m3', 'm1'] }),
          ],
        }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 5),
        }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          memberIds,
          trainingComponents,
          components,
        ),
      ).toThrow('Member cannot be part of multiple subgroups simultaneously');
    });

    it('should throw error if there are more than 5 components', () => {
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({ id: 'c1', from: now }),
        generateTrainingComponent({ id: 'c2', from: addMinutes(now, 5) }),
        generateTrainingComponent({ id: 'c3', from: addMinutes(now, 10) }),
        generateTrainingComponent({ id: 'c4', from: addMinutes(now, 15) }),
        generateTrainingComponent({ id: 'c5', from: addMinutes(now, 20) }),
        generateTrainingComponent({ id: 'c6', from: addMinutes(now, 25) }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 30),
        }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          [],
          [],
          trainingComponents,
          components,
        ),
      ).toThrow('You can only have up to 5 components per training');
    });

    it('should not throw error for valid training components', () => {
      const now = new Date();
      const trainingComponents = [
        generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          from: subMinutes(now, 5),
        }),
        generateTrainingComponent({
          id: 'c1',
          from: now,
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'e1' }),
                generateTrainingExercise({ id: 'e2' }),
              ],
            }),
          ],
          subgroups: [
            generateSubgroup({
              membersIds: ['m1'],
              supersets: [
                generateSuperset({
                  exercises: [generateTrainingExercise({ id: 'e1' })],
                }),
              ],
            }),
          ],
        }),
        generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          from: addMinutes(now, 5),
        }),
      ];

      expect(() =>
        service.validateTrainingComponents(
          exercises.filter((e) => e.id !== 'e5'), // remove invalid exercise
          ['m1'],
          trainingComponents,
          components,
        ),
      ).not.toThrow();
    });
  });

  it('should correctly populate exercise parameters', () => {
    const component = generateComponentStub({
      params: {
        [DEFAULT_PARAMS_KEY]: [
          {
            field: ParamType.VolWorkSets,
            options: [{ field: VolWorkSetType.Set, defaultValue: '4' }],
          },
          {
            field: ParamType.IntWork1,
            options: [
              { field: IntType.Kg, defaultValue: '30' },
              { field: IntType.Eff, options: [{ field: '0' }] },
            ],
          },
          {
            field: ParamType.IntWork2,
            defaultValue: IntType.Eff,
            options: [{ field: IntType.Eff, options: [{ field: '0' }] }],
          },
        ],
      },
    });

    const exercise = generateExerciseStub({ id: 'e1' });
    const trainingComponent = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e1' })],
        }),
      ],
    });

    componentService.getRoot = jest.fn().mockReturnValue(component);
    service.populateTrainingExerciseParams(
      [trainingComponent],
      [component],
      [exercise],
      [],
    );

    expect(trainingComponent.supersets[0].exercises[0].params).toEqual([
      {
        field: ParamType.VolWorkSets,
        name: 'Set',
        type: AttributeType.Select,
        defaultValue: VolWorkSetType.Set,
        options: [
          {
            field: VolWorkSetType.Set,
            name: 'Set',
            type: AttributeType.Number,
            defaultValue: '4',
            options: [],
          },
        ],
      },
      {
        field: ParamType.IntWork1,
        name: 'INT',
        type: AttributeType.Select,
        defaultValue: IntType.Kg,
        options: [
          {
            field: IntType.Kg,
            name: 'KG',
            unit: 'kg',
            type: AttributeType.Number,
            defaultValue: '30',
            options: [],
          },
          {
            field: IntType.Eff,
            name: 'Eff',
            type: AttributeType.Select,
            defaultValue: '0',
            options: [
              {
                field: '0',
                name: 'Easy',
                type: AttributeType.Value,
                options: [],
                defaultValue: '0',
              },
            ],
          },
        ],
      },
      {
        field: ParamType.IntWork2,
        name: 'INT',
        type: AttributeType.Select,
        defaultValue: IntType.Eff,
        options: [
          {
            field: IntType.Eff,
            name: 'Eff',
            type: AttributeType.Select,
            defaultValue: '0',
            options: [
              {
                field: '0',
                name: 'Easy',
                type: AttributeType.Value,
                options: [],
                defaultValue: '0',
              },
            ],
          },
        ],
      },
    ]);

    expect(trainingComponent.supersets[0].exercises[0].sets).toEqual([
      {
        setNumber: 1,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
      },
      {
        setNumber: 2,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
      },
      {
        setNumber: 3,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
      },
      {
        setNumber: 4,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}:0`,
            value: '0',
          },
        ],
      },
    ]);
  });

  it('should populate 1 set if no set type is provided', () => {
    const component = generateComponentStub({
      params: {
        [DEFAULT_PARAMS_KEY]: [
          { field: ParamType.IntWork1, options: [{ field: IntType.Kg }] },
        ],
      },
    });

    const exercise = generateExerciseStub({ id: 'e1' });
    const trainingComponent = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e1' })],
        }),
      ],
    });

    componentService.getRoot = jest.fn().mockReturnValue(component);
    service.populateTrainingExerciseParams(
      [trainingComponent],
      [component],
      [exercise],
      [],
    );

    expect(trainingComponent.supersets[0].exercises[0].params).toEqual([
      {
        field: ParamType.IntWork1,
        name: 'INT',
        type: AttributeType.Select,
        defaultValue: IntType.Kg,
        options: [
          {
            field: IntType.Kg,
            name: 'KG',
            unit: 'kg',
            type: AttributeType.Number,
            defaultValue: '20',
            options: [],
          },
        ],
      },
    ]);

    expect(trainingComponent.supersets[0].exercises[0].sets).toEqual([
      {
        setNumber: 1,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
        ],
      },
    ]);
  });

  it('should select all options if component params do not populate nested options', () => {
    const component = generateComponentStub({
      params: {
        [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
      },
    });

    const exercise = generateExerciseStub({ id: 'e1' });
    const trainingComponent = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e1' })],
        }),
      ],
    });

    componentService.getRoot = jest.fn().mockReturnValue(component);
    service.populateTrainingExerciseParams(
      [trainingComponent],
      [component],
      [exercise],
      [],
    );

    expect(trainingComponent.supersets[0].exercises[0].params).toEqual([
      PARAMS.find((p) => p.field === ParamType.VolWork1),
    ]);
  });

  it('should inherit custom default values for component params', () => {
    const attribute = generateAttributeStub({ type: AttributeType.Boolean });
    const component = generateComponentStub({
      params: {
        [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
        [attribute.field]: [
          {
            field: ParamType.VolWorkSets,
            defaultValue: VolWorkSetType.Set,
            options: [{ field: VolWorkSetType.Set, defaultValue: '12' }],
          },
        ],
      },
    });

    const exercise = generateExerciseStub({
      id: 'e1',
      attributeValues: [
        generateExerciseAttributeValueStub({
          field: attribute.field,
          value: 'true', // matches the condition
        }),
      ],
    });

    const trainingComponent = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e1' })],
        }),
      ],
    });

    componentService.getRoot = jest.fn().mockReturnValue(component);
    service.populateTrainingExerciseParams(
      [trainingComponent],
      [component],
      [exercise],
      [attribute],
    );

    expect(trainingComponent.supersets[0].exercises[0].params).toEqual([
      {
        ...PARAMS.find((p) => p.field === ParamType.VolWorkSets),
        defaultValue: VolWorkSetType.Set,
        options: [
          {
            ...VOL_WORK_SET_OPTIONS.find((o) => o.field === VolWorkSetType.Set),
            defaultValue: '12',
            options: [],
          },
        ],
      },
    ]);
  });

  it.each([
    { operator: 'gt', value: '100', testValue: '120' },
    { operator: 'gte', value: '100', testValue: '100' },
    { operator: 'lt', value: '100', testValue: '80' },
    { operator: 'lte', value: '100', testValue: '100' },
    { operator: 'range', value: '60-140', testValue: '100' },
  ])(
    'should correctly populate params based on custom attribute with operator $operator',
    ({ operator, value, testValue }) => {
      const attribute = generateAttributeStub({ type: AttributeType.Number });
      const component = generateComponentStub({
        params: {
          [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
          [`${attribute.field}:${operator}:${value}`]: [
            { field: ParamType.IntWork1 },
          ],
        },
      });

      const exerciseCustomParams = generateExerciseStub({
        id: 'e1',
        attributeValues: [
          generateExerciseAttributeValueStub({
            field: attribute.field,
            value: testValue,
          }),
        ],
      });

      const trainingComponentCustomParams = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
        ],
      });

      componentService.getRoot = jest.fn().mockReturnValue(component);
      service.populateTrainingExerciseParams(
        [trainingComponentCustomParams],
        [component],
        [exerciseCustomParams],
        [attribute],
      );

      const exerciseDefaultParams = generateExerciseStub({
        id: 'e2',
        attributeValues: [
          generateExerciseAttributeValueStub({
            field: attribute.field,
            value: ['gt', 'gte', 'range'].includes(operator) ? '50' : '200', // ensure this value does not match the condition
          }),
        ],
      });

      const trainingComponentDefaultParams = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
        ],
      });

      componentService.getRoot = jest.fn().mockReturnValue(component);
      service.populateTrainingExerciseParams(
        [trainingComponentDefaultParams],
        [component],
        [exerciseDefaultParams],
        [attribute],
      );

      expect(
        trainingComponentCustomParams.supersets[0].exercises[0].params,
      ).toEqual([PARAMS.find((p) => p.field === ParamType.IntWork1)]);

      expect(
        trainingComponentDefaultParams.supersets[0].exercises[0].params,
      ).toEqual([PARAMS.find((p) => p.field === ParamType.VolWork1)]);
    },
  );

  it.each([
    { operator: 'eq', value: 'rep', testValue: 'rep' },
    { operator: 'like', value: 'rep', testValue: 'repetition' },
  ])(
    'should correctly populate params based on custom attribute with operator $operator',
    ({ operator, value, testValue }) => {
      const attribute = generateAttributeStub({ type: AttributeType.String });
      const component = generateComponentStub({
        params: {
          [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
          [`${attribute.field}:${operator}:${value}`]: [
            { field: ParamType.IntWork1 },
          ],
        },
      });

      const exerciseCustomParams = generateExerciseStub({
        id: 'e1',
        attributeValues: [
          generateExerciseAttributeValueStub({
            field: attribute.field,
            value: testValue,
          }),
        ],
      });

      const trainingComponentCustomParams = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
        ],
      });

      componentService.getRoot = jest.fn().mockReturnValue(component);
      service.populateTrainingExerciseParams(
        [trainingComponentCustomParams],
        [component],
        [exerciseCustomParams],
        [attribute],
      );

      const exerciseDefaultParams = generateExerciseStub({
        id: 'e2',
        attributeValues: [
          generateExerciseAttributeValueStub({
            field: attribute.field,
            value: operator === 'eq' ? 'time' : 'distance', // Ensure this value does not match the condition
          }),
        ],
      });

      const trainingComponentDefaultParams = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
        ],
      });

      componentService.getRoot = jest.fn().mockReturnValue(component);
      service.populateTrainingExerciseParams(
        [trainingComponentDefaultParams],
        [component],
        [exerciseDefaultParams],
        [attribute],
      );

      expect(
        trainingComponentCustomParams.supersets[0].exercises[0].params,
      ).toEqual([PARAMS.find((p) => p.field === ParamType.IntWork1)]);

      expect(
        trainingComponentDefaultParams.supersets[0].exercises[0].params,
      ).toEqual([PARAMS.find((p) => p.field === ParamType.VolWork1)]);
    },
  );

  it('should correctly populate params based on custom attribute with operator NOT (non-existing value or false boolean)', () => {
    const attribute = generateAttributeStub({ type: AttributeType.Boolean });
    const component = generateComponentStub({
      params: {
        [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
        [`${attribute.field}:!`]: [{ field: ParamType.IntWork1 }],
      },
    });

    // case 1: Attribute value is 'false'
    const exerciseFalseBoolean = generateExerciseStub({
      id: 'e1',
      attributeValues: [
        generateExerciseAttributeValueStub({
          field: attribute.field,
          value: 'false',
        }),
      ],
    });

    const trainingComponentFalseBoolean = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e1' })],
        }),
      ],
    });

    // case 2: attribute value does not exist
    const exerciseNonExistingValue = generateExerciseStub({ id: 'e2' });
    const trainingComponentNonExistingValue = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e2' })],
        }),
      ],
    });

    // case 3: attribute value is 'true' (does not match the condition)
    const exerciseDefault = generateExerciseStub({
      id: 'e3',
      attributeValues: [
        generateExerciseAttributeValueStub({
          field: attribute.field,
          value: 'true',
        }),
      ],
    });

    const trainingComponentDefault = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e3' })],
        }),
      ],
    });

    componentService.getRoot = jest.fn().mockReturnValue(component);

    // Test Case 1: Boolean false
    service.populateTrainingExerciseParams(
      [trainingComponentFalseBoolean],
      [component],
      [exerciseFalseBoolean],
      [attribute],
    );

    // Test Case 2: Empty value
    service.populateTrainingExerciseParams(
      [trainingComponentNonExistingValue],
      [component],
      [exerciseNonExistingValue],
      [attribute],
    );

    // Test Case 3: Default case (true boolean)
    service.populateTrainingExerciseParams(
      [trainingComponentDefault],
      [component],
      [exerciseDefault],
      [attribute],
    );

    // Assertions
    expect(
      trainingComponentFalseBoolean.supersets[0].exercises[0].params,
    ).toEqual([PARAMS.find((p) => p.field === ParamType.IntWork1)]);

    expect(
      trainingComponentNonExistingValue.supersets[0].exercises[0].params,
    ).toEqual([PARAMS.find((p) => p.field === ParamType.IntWork1)]);

    expect(trainingComponentDefault.supersets[0].exercises[0].params).toEqual([
      PARAMS.find((p) => p.field === ParamType.VolWork1),
    ]);
  });

  it('should correctly populate params based on custom attribute with no operator (boolean true)', () => {
    const attribute = generateAttributeStub({ type: AttributeType.Boolean });
    const component = generateComponentStub({
      params: {
        [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
        [attribute.field]: [{ field: ParamType.IntWork1 }],
      },
    });

    // Case 1: Attribute value is 'true' (matches the condition)
    const exerciseTrueBoolean = generateExerciseStub({
      id: 'e1',
      attributeValues: [
        generateExerciseAttributeValueStub({
          field: attribute.field,
          value: 'true',
        }),
      ],
    });

    const trainingComponentTrueBoolean = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e1' })],
        }),
      ],
    });

    // Case 2: Attribute value is 'false' (does not match the condition)
    const exerciseFalseBoolean = generateExerciseStub({
      id: 'e2',
      attributeValues: [
        generateExerciseAttributeValueStub({
          field: attribute.field,
          value: 'false',
        }),
      ],
    });

    const trainingComponentFalseBoolean = generateTrainingComponent({
      supersets: [
        generateSuperset({
          exercises: [generateTrainingExercise({ id: 'e2' })],
        }),
      ],
    });

    // Mock the componentService.getRoot method
    componentService.getRoot = jest.fn().mockReturnValue(component);

    // Test Case 1: Boolean true
    service.populateTrainingExerciseParams(
      [trainingComponentTrueBoolean],
      [component],
      [exerciseTrueBoolean],
      [attribute],
    );

    // Test Case 2: Boolean false
    service.populateTrainingExerciseParams(
      [trainingComponentFalseBoolean],
      [component],
      [exerciseFalseBoolean],
      [attribute],
    );

    // Assertions
    expect(
      trainingComponentTrueBoolean.supersets[0].exercises[0].params,
    ).toEqual([PARAMS.find((p) => p.field === ParamType.IntWork1)]);
    expect(
      trainingComponentFalseBoolean.supersets[0].exercises[0].params,
    ).toEqual([PARAMS.find((p) => p.field === ParamType.VolWork1)]);
  });

  describe('getSetData', () => {
    it('should create correct number of sets based on VolWorkSets parameter', () => {
      const componentParams: ComponentParam[] = [
        {
          field: ParamType.VolWorkSets,
          options: [
            {
              field: VolWorkSetType.Set,
              defaultValue: '3',
            },
          ],
        },
        {
          field: ParamType.IntWork1,
          options: [
            {
              field: IntType.Kg,
              defaultValue: '20',
            },
          ],
        },
      ];

      const params = service.getParamAttributes(componentParams);
      const result = service.getSetData(params);

      expect(result.length).toBe(3);
      expect(result[0].setNumber).toBe(1);
      expect(result[1].setNumber).toBe(2);
      expect(result[2].setNumber).toBe(3);

      // Each set should have the correct param values
      result.forEach((set) => {
        for (const paramValues of [set.paramValuesL, set.paramValuesR])
          expect(paramValues).toEqual([
            { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
          ]);
      });
    });

    it('should create 1 set by default when VolWorkSets parameter is not provided', () => {
      const componentParams: ComponentParam[] = [
        {
          field: ParamType.IntWork1,
          options: [
            {
              field: IntType.Kg,
              defaultValue: '20',
            },
          ],
        },
      ];

      const params = service.getParamAttributes(componentParams);
      const result = service.getSetData(params);

      expect(result.length).toBe(1);
      expect(result[0].setNumber).toBe(1);

      expect(result[0].paramValuesL).toEqual([
        { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
      ]);

      expect(result[0].paramValuesR).toEqual([
        { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
      ]);
    });

    it('should create sets with provided paramValues when available', () => {
      const componentParams: ComponentParam[] = [
        {
          field: ParamType.VolWorkSets,
          options: [
            {
              field: VolWorkSetType.Set,
              defaultValue: '2',
            },
          ],
        },
        {
          field: ParamType.IntWork1,
          options: [
            {
              field: IntType.Kg,
              defaultValue: '20',
            },
          ],
        },
      ];

      const paramValues: AttributeValue[] = [
        {
          field: ParamType.IntWork1,
          selected: IntType.Kg,
          value: '25',
        },
      ];

      const params = service.getParamAttributes(componentParams);
      const result = service.getSetData(params, paramValues);

      expect(result.length).toBe(2);
      result.forEach((set) => {
        for (const paramValues of [set.paramValuesL, set.paramValuesR])
          expect(paramValues).toEqual([
            { field: ParamType.IntWork1, selected: IntType.Kg, value: '25' },
          ]);
      });
    });

    it('should handle nested parameter options correctly', () => {
      const componentParams: ComponentParam[] = [
        {
          field: ParamType.VolWorkSets,
          options: [
            {
              field: VolWorkSetType.Set,
              defaultValue: '1',
            },
          ],
        },
        {
          field: ParamType.IntWork1,
          options: [
            {
              field: IntType.Eff,
              options: [{ field: '2', defaultValue: '2' }],
            },
          ],
        },
      ];

      const params = service.getParamAttributes(componentParams);
      const result = service.getSetData(params);

      expect(result.length).toBe(1);

      for (const paramValues of [
        result[0].paramValuesL,
        result[0].paramValuesR,
      ])
        expect(paramValues).toEqual([
          {
            field: ParamType.IntWork1,
            selected: `${IntType.Eff}:2`,
            value: '2',
          },
        ]);
    });

    it('should filter out VolWorkSets from the param values', () => {
      const componentParams: ComponentParam[] = [
        {
          field: ParamType.VolWorkSets,
          options: [
            {
              field: VolWorkSetType.Set,
              defaultValue: '1',
            },
          ],
        },
        {
          field: ParamType.IntWork1,
          options: [
            {
              field: IntType.Kg,
              defaultValue: '20',
            },
          ],
        },
      ];

      const params = service.getParamAttributes(componentParams);
      const result = service.getSetData(params);

      for (const paramValues of [
        result[0].paramValuesL,
        result[0].paramValuesR,
      ]) {
        expect(paramValues).not.toContainEqual(
          expect.objectContaining({ field: ParamType.VolWorkSets }),
        );

        expect(paramValues).toEqual([
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
        ]);
      }
    });

    it('should handle empty params array', () => {
      const result = service.getSetData([]);
      expect(result.length).toBe(1); // Default 1 set
      expect(result[0].paramValuesL).toEqual([]); // No params to include
      expect(result[0].paramValuesR).toEqual([]); // No params to include
    });

    it('should handle params without options', () => {
      const componentParams: ComponentParam[] = [
        {
          field: ParamType.IntWork1,
          defaultValue: '30',
        },
      ];

      const params = service.getParamAttributes(componentParams);
      const result = service.getSetData(params);

      expect(result.length).toBe(1);
      for (const paramValues of [
        result[0].paramValuesL,
        result[0].paramValuesR,
      ])
        expect(paramValues).toEqual([
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
        ]);
    });
  });
});
