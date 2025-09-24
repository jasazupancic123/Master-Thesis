import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeRepository } from '@src/attribute/repository/attribute.repository';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { PARAMS } from '@src/component/constant/param.constant';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { generateComponentParamsStub } from '@src/component/mock/component-param.stub';
import { validationSchema } from '@src/config/environment-validation-schema';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import type { Method } from '@src/method/entity/method.entity';
import {
  MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT,
  MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT,
} from '@src/training/constant/training-limits.constant';
import { MainSet } from '@src/training/enum/main-set.enum';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

describe('validateSupersets', () => {
  let service: TrainingPlanService;
  let componentService: ComponentService;

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
          provide: ComponentService,
          useValue: createMock<ComponentService>(),
        },
        {
          provide: InstitutionService,
          useValue: createMock<InstitutionService>(),
        },
        {
          provide: ExerciseService,
          useValue: createMock<ExerciseService>(),
        },
        {
          provide: ExerciseAttributeService,
          useValue: createMock<ExerciseAttributeService>(),
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
  });

  const root = generateComponentStub({ id: 'c1' });
  beforeEach(() => {
    jest.spyOn(componentService, 'getRoot').mockImplementation(() => root);
    jest
      .spyOn(componentService, 'getComponentParamAttributes')
      .mockReturnValue(
        generateComponentParamsStub([ParamType.VolWork1, ParamType.IntWork1]),
      );
    jest.spyOn(componentService, 'getParamAttributes').mockReturnValue(PARAMS);
  });

  const exercises = [
    generateExerciseStub({ id: 'e1', componentIds: ['leaf1'] }),
    generateExerciseStub({ id: 'e2', componentIds: ['leaf1'] }),
    generateExerciseStub({ id: 'e3', componentIds: ['leaf2'] }),
    generateExerciseStub({ id: 'e4', componentIds: ['leaf3'] }),
    generateExerciseStub({ id: 'e5', componentIds: ['leaf3'] }),
    generateExerciseStub({ id: 'e6', componentIds: ['leaf3'] }),
    generateExerciseStub({ id: 'e7', componentIds: ['leaf3'] }),
    generateExerciseStub({ id: 'e8', componentIds: ['leaf3'] }),
    generateExerciseStub({ id: 'e9', componentIds: ['leaf3'] }),
  ];

  const data = {
    exercises,
    components: [root],
    methods: [],
    attributes: [],
  };

  it.each([
    [
      MainSet.BLOCK,
      MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT,
      `You can only have up to ${MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT} supersets per training component for block sets`,
    ],
    [
      MainSet.CIRCUIT,
      MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT,
      `You can only have ${MAX_NUM_SUPERSETS_IN_CIRCUIT_COMPONENT} circuit set`,
    ],
  ])(
    'should throw error if there are more than %i supersets in a training component for %s main set type',
    (mainSet, maxSupersets, errorMessage) => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        mainSet,
        supersets: Array.from({ length: maxSupersets + 1 }, (_, i) =>
          generateSuperset({
            exercises: [generateTrainingExercise({ id: `e${i + 1}` })],
          }),
        ),
      });

      expect(() =>
        service.validateSupersets(trainingComponent, trainingComponent, data),
      ).toThrow(errorMessage);
    },
  );

  it.each([
    [MainSet.BLOCK, 4],
    [MainSet.CIRCUIT, 16],
  ])(
    'should throw error if there are more than %i exercises in a superset for main set type of %s',
    (mainSet, maxExercises) => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        mainSet,
        supersets: [
          generateSuperset({
            exercises: Array.from({ length: maxExercises + 1 }, (_, i) =>
              generateTrainingExercise({ id: `e${i + 1}` }),
            ),
          }),
        ],
      });

      expect(() =>
        service.validateSupersets(trainingComponent, trainingComponent, data),
      ).toThrow(
        `You can only have up to ${maxExercises} exercises per superset for ${mainSet.toLowerCase()} sets`,
      );
    },
  );

  it('should throw error if there is a invalid exercise in a superset', () => {
    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      supersets: [
        generateSuperset({
          exercises: [
            generateTrainingExercise({ id: 'e1' }),
            generateTrainingExercise({ id: 'e2' }),
            generateTrainingExercise({ id: 'invalid-exercise' }), // invalid
          ],
        }),
      ],
    });

    expect(() =>
      service.validateSupersets(trainingComponent, trainingComponent, data),
    ).toThrow('Training exercise not found');
  });

  describe('validateSupersets with methods', () => {
    const MIN_SET = 5;
    const MAX_SET = 10;
    const MIN_REP = 15;
    const MAX_REP = 12;

    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      methodId: 'm1',
      supersets: [
        generateSuperset({
          exercises: [
            generateTrainingExercise({
              id: 'e1',
              sets: [
                generateExerciseSet(1, [
                  {
                    field: ParamType.VolWork1,
                    selected: VolType.Rep,
                    value: '12',
                  },
                  {
                    field: ParamType.IntWork1,
                    selected: IntType.Kg,
                    value: '20',
                  },
                ]),
              ],
            }),
          ],
        }),
      ],
    });

    const methods = [
      {
        id: 'm1',
        name: 'Method1',
        ability: 'Ability1',
        attributes: [
          {
            field: 'vol1',
            defaultValue: 'rep',
            options: [
              { field: 'rep', defaultValue: '12', min: MIN_REP, max: MAX_REP },
            ],
          },
          {
            field: 'volWorkSets',
            defaultValue: 'set',
            options: [
              { field: 'set', defaultValue: 5, min: MIN_SET, max: MAX_SET },
            ],
          },
        ],
        componentId: 'strength',
        intensity: '100%',
        tempo: '1',
        recovery: '60',
      },
      {
        id: 'm2',
        name: 'Method2',
        ability: 'Ability2',
        attributes: [
          {
            field: 'vol1',
            defaultValue: 'rep',
            options: [{ field: 'rep', defaultValue: '12', min: 5, max: 12 }],
          },
          {
            field: 'volWorkSets',
            defaultValue: 'set',
            options: [{ field: 'set', defaultValue: 5, min: 1, max: 10 }],
          },
        ],
        componentId: 'strength',
        intensity: '100%',
        tempo: '1',
        recovery: '60',
      },
    ] as Method[];

    it('should not throw error if no method is on training component', () => {
      const copyTrainingComponent = { ...trainingComponent };
      copyTrainingComponent.methodId = undefined;

      expect(() =>
        service.validateSupersets(
          copyTrainingComponent,
          copyTrainingComponent,
          { ...data, methods },
        ),
      ).not.toThrow(); // If no error is thrown, the test passes
    });

    it('should throw error if invalid method is provided', () => {
      const copyTrainingComponent = { ...trainingComponent };
      copyTrainingComponent.methodId = 'invalidMethodId';

      expect(() => {
        service.validateSupersets(
          copyTrainingComponent,
          copyTrainingComponent,
          { ...data, methods },
        );
      }).toThrow('Method not found for training component');
    });

    it('should throw error if attribute value is out of range', () => {
      expect(() => {
        service.validateSupersets(trainingComponent, trainingComponent, {
          ...data,
          methods,
        });
      }).toThrow(`Value for vol1 cannot be less than ${MIN_REP}`);
    });

    it('should successfully validate exercise values', () => {
      const copyTrainingComponent = { ...trainingComponent };
      copyTrainingComponent.methodId = 'm2';

      expect(() =>
        service.validateSupersets(
          copyTrainingComponent,
          copyTrainingComponent,
          { ...data, methods },
        ),
      ).not.toThrow(); // If no error is thrown, the test passes
    });
  });

  it('should successfuly validate supersets', () => {
    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      supersets: [
        generateSuperset({
          exercises: [
            generateTrainingExercise({ id: 'e1' }),
            generateTrainingExercise({ id: 'e2' }),
          ],
        }),
        generateSuperset({
          exercises: [
            generateTrainingExercise({ id: 'e3' }),
            generateTrainingExercise({ id: 'e4' }),
          ],
        }),
      ],
      subgroups: [
        generateSubgroup({
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'e5' }),
                generateTrainingExercise({ id: 'e6' }),
              ],
            }),
          ],
        }),
      ],
    });

    expect(() =>
      service.validateSupersets(trainingComponent, trainingComponent, data),
    ).not.toThrow();
  });
});
