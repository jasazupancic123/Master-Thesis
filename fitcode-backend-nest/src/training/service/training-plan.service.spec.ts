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
          { field: ParamType.VolWorkSets },
          {
            field: ParamType.IntWork1,
            options: [
              { field: IntType.Kg },
              { field: IntType.Eff, options: [{ field: 'easy' }] },
            ],
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
    service.populateExerciseParams(
      [trainingComponent],
      [component],
      [exercise],
      [],
    );

    expect(trainingComponent.supersets[0].exercises[0].params).toEqual([
      PARAMS.find((p) => p.field === ParamType.VolWorkSets)!,
      {
        field: ParamType.IntWork1,
        name: 'INT',
        type: AttributeType.Select,
        defaultValue: undefined,
        options: [
          {
            field: IntType.Kg,
            name: 'KG',
            unit: 'kg',
            type: AttributeType.Number,
            options: [],
            defaultValue: undefined,
          },
          {
            field: IntType.Eff,
            name: 'Eff',
            type: AttributeType.Select,
            options: [
              {
                field: 'easy',
                name: 'Easy',
                type: AttributeType.Value,
                options: [],
                defaultValue: undefined,
              },
            ],
          },
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
    service.populateExerciseParams(
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
    service.populateExerciseParams(
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
      service.populateExerciseParams(
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
      service.populateExerciseParams(
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
      service.populateExerciseParams(
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
      service.populateExerciseParams(
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
    service.populateExerciseParams(
      [trainingComponentFalseBoolean],
      [component],
      [exerciseFalseBoolean],
      [attribute],
    );

    // Test Case 2: Empty value
    service.populateExerciseParams(
      [trainingComponentNonExistingValue],
      [component],
      [exerciseNonExistingValue],
      [attribute],
    );

    // Test Case 3: Default case (true boolean)
    service.populateExerciseParams(
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
    service.populateExerciseParams(
      [trainingComponentTrueBoolean],
      [component],
      [exerciseTrueBoolean],
      [attribute],
    );

    // Test Case 2: Boolean false
    service.populateExerciseParams(
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
});
