import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { validationSchema } from '../../config/environment-validation-schema';
import { FirebaseModule } from '../../firebase/firebase.module';
import { TrainingPlanService } from './training-plan.service';
import { ComponentModule } from '../../component/component.module';
import { ExerciseModule } from '../../exercise/exercise.module';
import { UserModule } from '../../user/user.module';
import { GroupModule } from '../../group/group.module';
import { CacheManagerModule } from '../../cache-manager/cache-manager.module';
import { AttributeModule } from '../../attribute/attribute.module';
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
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '../mock/training.stub';
import { AttributeType } from '../../common/enum/attribute-type.enum';
import { ComponentParam } from 'src/component/entity/component-param.entity';
import { AttributeValue } from 'src/attribute/entity/attribute-value.entity';

describe('TrainingPlanService (unit)', () => {
  let service: TrainingPlanService;
  let componentService: ComponentService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema }),
        FirebaseModule.forRoot(),
        CommonModule,
        AttributeModule,
        CacheManagerModule,
        ComponentModule,
        ExerciseModule,
        UserModule,
        GroupModule,
      ],
      providers: [
        TrainingPlanService,
        {
          provide: ComponentService,
          useValue: {
            getRoot: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TrainingPlanService);
    componentService = moduleRef.get(ComponentService);
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
        paramValues: [
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
        paramValues: [
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
        paramValues: [
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
        paramValues: [
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
        paramValues: [
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
        expect(set.paramValues).toEqual([
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
      expect(result[0].paramValues).toEqual([
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
        expect(set.paramValues).toEqual([
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
      expect(result[0].paramValues).toEqual([
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

      expect(result[0].paramValues).not.toContainEqual(
        expect.objectContaining({ field: ParamType.VolWorkSets }),
      );

      expect(result[0].paramValues).toEqual([
        { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
      ]);
    });

    it('should handle empty params array', () => {
      const result = service.getSetData([]);
      expect(result.length).toBe(1); // Default 1 set
      expect(result[0].paramValues).toEqual([]); // No params to include
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
      expect(result[0].paramValues).toEqual([
        { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
      ]);
    });
  });
});
