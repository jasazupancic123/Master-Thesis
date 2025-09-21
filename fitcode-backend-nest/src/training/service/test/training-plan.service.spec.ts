import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { generateAttributeStub } from '@src/attribute/mock/attribute.stub';
import { generateExerciseAttributeValueStub } from '@src/attribute/mock/attribute-value.stub';
import { AttributeRepository } from '@src/attribute/repository/attribute.repository';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { AttributeType } from '@src/common/enum/attribute-type.enum';
import { ComponentService } from '@src/component/component.service';
import {
  DEFAULT_PARAMS_KEY,
  PARAMS,
  VOL_WORK_SET_OPTIONS,
} from '@src/component/constant/param.constant';
import {
  IntType,
  ParamType,
  VolWorkSetType,
} from '@src/component/enum/param.enum';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { ComponentRepository } from '@src/component/repository/component.repository';
import { validationSchema } from '@src/config/environment-validation-schema';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseAttributeValueRepository } from '@src/exercise/repository/exercise-attribute-value.repository';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

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
          provide: FirebaseService,
          useValue: createMock<FirebaseService>(),
        },
        {
          provide: CacheManagerService,
          useValue: createMock<CacheManagerService>(),
        },
        {
          provide: AttributeRepository,
          useValue: createMock<AttributeRepository>(),
        },
        AttributeService,
        {
          provide: ComponentRepository,
          useValue: createMock<ComponentRepository>,
        },
        ComponentService,
        {
          provide: InstitutionService,
          useValue: createMock<InstitutionService>(),
        },
        {
          provide: ExerciseService,
          useValue: createMock<ExerciseService>(),
        },
        {
          provide: ExerciseAttributeValueRepository,
          useValue: createMock<ExerciseAttributeValueRepository>(),
        },
        {
          provide: WorkloadRepository,
          useValue: createMock<WorkloadRepository>(),
        },
        {
          provide: WorkloadService,
          useValue: createMock<WorkloadService>(),
        },
        TrainingPlanService,
      ],
    }).compile();

    service = moduleRef.get(TrainingPlanService);
    componentService = moduleRef.get(ComponentService);
    exerciseService = moduleRef.get(ExerciseService);
  });

  it('should find all training exercises', async () => {
    exerciseService.getAll = jest
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

    const result = await service.getAllTrainingExercises(trainingComponents);

    expect(result).toHaveLength(5);
    expect(result).toEqual([
      expect.objectContaining({ id: 'e1' }),
      expect.objectContaining({ id: 'e2' }),
      expect.objectContaining({ id: 'e3' }),
      expect.objectContaining({ id: 'e4' }),
      expect.objectContaining({ id: 'e5' }),
    ]);
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

    const exercise = generateExerciseStub({ id: 'e1', isBilateral: true });
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
        description: 'work sets',
        type: AttributeType.Select,
        defaultValue: VolWorkSetType.Set,
        options: [
          {
            field: VolWorkSetType.Set,
            name: 'Set',
            type: AttributeType.Number,
            defaultValue: '4',
          },
        ],
      },
      {
        field: ParamType.IntWork1,
        name: 'INT',
        description: 'intensity',
        type: AttributeType.Select,
        defaultValue: IntType.Kg,
        options: [
          {
            field: IntType.Kg,
            name: 'KG',
            description: 'kilograms',
            unit: 'kg',
            type: AttributeType.Number,
            defaultValue: '30',
          },
          {
            field: IntType.Eff,
            name: 'Eff',
            description: 'effort',
            type: AttributeType.Number,
            defaultValue: '2',
            min: 1,
            max: 4,
          },
        ],
      },
      {
        field: ParamType.IntWork2,
        name: 'INT',
        description: 'intensity',
        type: AttributeType.Select,
        defaultValue: IntType.Eff,
        options: [
          {
            field: IntType.Eff,
            name: 'Eff',
            description: 'effort',
            type: AttributeType.Number,
            defaultValue: '2',
            min: 1,
            max: 4,
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
            selected: `${IntType.Eff}`,
            value: '2',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}`,
            value: '2',
          },
        ],
      },
      {
        setNumber: 2,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}`,
            value: '2',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}`,
            value: '2',
          },
        ],
      },
      {
        setNumber: 3,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}`,
            value: '2',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}`,
            value: '2',
          },
        ],
      },
      {
        setNumber: 4,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}`,
            value: '2',
          },
        ],
        paramValuesR: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '30' },
          {
            field: ParamType.IntWork2,
            selected: `${IntType.Eff}`,
            value: '2',
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

    const exercise = generateExerciseStub({ id: 'e1', isBilateral: false });
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
        description: 'intensity',
        type: AttributeType.Select,
        defaultValue: IntType.Kg,
        options: [
          {
            field: IntType.Kg,
            name: 'KG',
            description: 'kilograms',
            unit: 'kg',
            type: AttributeType.Number,
            defaultValue: '50',
          },
        ],
      },
    ]);

    expect(trainingComponent.supersets[0].exercises[0].sets).toEqual([
      {
        setNumber: 1,
        paramValuesL: [
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '50' },
        ],
        paramValuesR: undefined,
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

  it.each([
    ['opt-1', PARAMS.find((p) => p.field === ParamType.IntRec1)],
    ['opt-2', PARAMS.find((p) => p.field === ParamType.IntWork2)],
    ['opt-3', PARAMS.find((p) => p.field === ParamType.VolRec1)],
  ])(
    'should correctly populate params based on custom select attribute with a few option values',
    (option, targetParams) => {
      const attribute = generateAttributeStub({
        field: 'opts',
        type: AttributeType.Select,
        options: [
          generateAttributeStub({ field: 'opt-1', type: AttributeType.Value }),
          generateAttributeStub({ field: 'opt-2', type: AttributeType.Value }),
          generateAttributeStub({ field: 'opt-3', type: AttributeType.Value }),
        ],
      });

      const component = generateComponentStub({
        params: {
          [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
          'opts:selected:opt-1': [{ field: ParamType.IntRec1 }],
          'opts:selected:opt-2': [{ field: ParamType.IntWork2 }],
          'opts:selected:opt-3': [{ field: ParamType.VolRec1 }],
        },
      });

      const exercise = generateExerciseStub({
        id: 'e1',
        attributeValues: [
          generateExerciseAttributeValueStub({
            field: attribute.field,
            value: option,
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
        targetParams,
      ]);
    },
  );

  // NOTE - passing boolean with not condition will match anything, so do not do it!
  it.each([
    ['str', 'test123', PARAMS.find((p) => p.field === ParamType.VolWork2)],
    ['str', 'otherTest', PARAMS.find((p) => p.field === ParamType.IntRec1)],
    ['str', 'asdf', PARAMS.find((p) => p.field === ParamType.VolWork1)],
    ['num', '110', PARAMS.find((p) => p.field === ParamType.VolWork1)],
    ['num', '150', PARAMS.find((p) => p.field === ParamType.IntWork1)],
    // ['bool', 'true', PARAMS.find((p) => p.field === ParamType.IntWork2)],
    // ['bool', 'false', PARAMS.find((p) => p.field === ParamType.VolWork1)],
    ['select', 'opt1', PARAMS.find((p) => p.field === ParamType.VolRec1)],
    ['select', 'opt2', PARAMS.find((p) => p.field === ParamType.IntRec1)],
  ])(
    'should correctly populate params for complex component params for field %s with value %s',
    (field, value, targetParams) => {
      const attributes = [
        generateAttributeStub({ field: 'str', type: AttributeType.String }),
        generateAttributeStub({ field: 'num', type: AttributeType.Number }),
        generateAttributeStub({ field: 'bool', type: AttributeType.Boolean }),
        generateAttributeStub({
          field: 'select',
          type: AttributeType.Select,
          options: [
            generateAttributeStub({ field: 'opt1', type: AttributeType.Value }),
            generateAttributeStub({ field: 'opt2', type: AttributeType.Value }),
          ],
        }),
      ];

      const component = generateComponentStub({
        params: {
          [DEFAULT_PARAMS_KEY]: [{ field: ParamType.VolWork1 }],
          'str:eq:test123': [{ field: ParamType.VolWork2 }],
          'str:eq:otherTest': [{ field: ParamType.IntRec1 }],
          'num:gt:123': [{ field: ParamType.IntWork1 }],
          // 'bool:!': [{ field: ParamType.IntWork2 }],
          'select:selected:opt1': [{ field: ParamType.VolRec1 }],
          'select:selected:opt2': [{ field: ParamType.IntRec1 }],
        },
      });

      const exercise = generateExerciseStub({
        id: 'e1',
        attributeValues: [generateExerciseAttributeValueStub({ field, value })],
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
        attributes,
      );

      expect(trainingComponent.supersets[0].exercises[0].params).toEqual([
        expect.objectContaining(targetParams),
      ]);
    },
  );
});
