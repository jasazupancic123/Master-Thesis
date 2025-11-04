import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { validationSchema } from '@src/config/environment-validation-schema';
import type { Method } from '@src/exercise/entity/method.entity';
import { generateComponentStub } from '@src/exercise/mock/component.stub';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import {
  MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET,
  MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET,
  MAX_NUM_SUPERSETS,
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

jest.mock('@src/exercise/constant/method.constant', () => {
  const method: Method = {
    field: 'm1',
    name: 'Method1',
    componentId: 'strength',
    attributes: [
      { field: 'sets', min: 3, max: 10 },
      { field: 'reps', min: 5, max: 12 },
      { field: 'tempoEcc', min: 1, max: 3 },
      { field: 'tempoIso', min: 1, max: 2 },
      { field: 'tempoCon', min: 1, max: 3 },
      { field: 'tempoIdle', min: 0, max: 4 },
      { field: 'recTime', min: 60, max: 60 },
    ],
  };

  return { Methods: [method] };
});

describe('validateSupersets', () => {
  let service: TrainingPlanService;
  let exerciseAttributeService: ExerciseAttributeService;

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
        AttributeService,
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
        ExerciseParamService,
        TrainingPlanService,
      ],
    }).compile();

    service = moduleRef.get(TrainingPlanService);
    exerciseAttributeService = moduleRef.get(ExerciseAttributeService);
  });

  const root = generateComponentStub({ field: 'c1' });
  beforeEach(() => {
    jest
      .spyOn(exerciseAttributeService, 'getRootMainComponent')
      .mockImplementation(() => root);
  });

  const exercises = [
    generateExerciseStub({ id: 'e1' }),
    generateExerciseStub({ id: 'e2' }),
    generateExerciseStub({ id: 'e3' }),
    generateExerciseStub({ id: 'e4' }),
    generateExerciseStub({ id: 'e5' }),
    generateExerciseStub({ id: 'e6' }),
    generateExerciseStub({ id: 'e7' }),
    generateExerciseStub({ id: 'e8' }),
    generateExerciseStub({ id: 'e9' }),
    generateExerciseStub({ id: 'e10' }),
    generateExerciseStub({ id: 'e11' }),
    generateExerciseStub({ id: 'e12' }),
  ];

  const data = { exercises, components: [root], methods: [], attributes: [] };

  it('should throw error if there are more than max num supersets in a training component', () => {
    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      supersets: Array.from({ length: MAX_NUM_SUPERSETS + 1 }, (_, i) =>
        generateSuperset({
          exercises: [generateTrainingExercise({ id: `e${i + 1}` })],
        }),
      ),
    });

    expect(() => service.validateSupersets(trainingComponent, data)).toThrow(
      `You can only have up to ${MAX_NUM_SUPERSETS} supersets per component`,
    );
  });

  it.each([
    [MainSet.BLOCK, MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET],
    [MainSet.CIRCUIT, MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET],
  ])(
    'should throw error if there are more than %i exercises in a superset for main set type of %s',
    (mainSet, maxExercises) => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            mainSet,
            exercises: Array.from({ length: maxExercises + 1 }, (_, i) =>
              generateTrainingExercise({ id: `e${i + 1}` }),
            ),
          }),
        ],
      });

      expect(() => service.validateSupersets(trainingComponent, data)).toThrow(
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

    expect(() => service.validateSupersets(trainingComponent, data)).toThrow(
      'Training exercise not found',
    );
  });

  describe('validateSupersets warmup/cooldown logic', () => {
    it('should throw error if superset is both warmup and cooldown', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            warmup: true,
            cooldown: true,
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
        ],
      });

      expect(() => service.validateSupersets(trainingComponent, data)).toThrow(
        'Superset 1 cannot be both warmup and cooldown',
      );
    });

    it('should throw error if warmup superset comes after non-warmup superset', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
          generateSuperset({
            warmup: true,
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
        ],
      });

      expect(() => service.validateSupersets(trainingComponent, data)).toThrow(
        'Warmup supersets must be at the beginning',
      );
    });

    it('should throw error if cooldown superset comes before non-cooldown superset', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            cooldown: true,
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
        ],
      });

      expect(() => service.validateSupersets(trainingComponent, data)).toThrow(
        'Cooldown supersets must be at the end',
      );
    });

    it('should allow warmup supersets only at the beginning', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            warmup: true,
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
          generateSuperset({
            warmup: true,
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e3' })],
          }),
        ],
      });

      expect(() =>
        service.validateSupersets(trainingComponent, data),
      ).not.toThrow();
    });

    it('should allow cooldown supersets only at the end', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
          generateSuperset({
            cooldown: true,
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
          generateSuperset({
            cooldown: true,
            exercises: [generateTrainingExercise({ id: 'e3' })],
          }),
        ],
      });

      expect(() =>
        service.validateSupersets(trainingComponent, data),
      ).not.toThrow();
    });

    it('should allow warmup, normal, then cooldown sequence', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            warmup: true,
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
          generateSuperset({
            cooldown: true,
            exercises: [generateTrainingExercise({ id: 'e3' })],
          }),
        ],
      });

      expect(() =>
        service.validateSupersets(trainingComponent, data),
      ).not.toThrow();
    });

    it('should allow single superset to be warmup', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            warmup: true,
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
        ],
      });

      expect(() =>
        service.validateSupersets(trainingComponent, data),
      ).not.toThrow();
    });

    it('should allow single superset to be cooldown', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            cooldown: true,
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
        ],
      });

      expect(() =>
        service.validateSupersets(trainingComponent, data),
      ).not.toThrow();
    });

    it('should allow only normal supersets (no warmup or cooldown)', () => {
      const trainingComponent = generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e2' })],
          }),
        ],
      });

      expect(() =>
        service.validateSupersets(trainingComponent, data),
      ).not.toThrow();
    });
  });

  describe('validateSupersets with methods', () => {
    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      supersets: [
        generateSuperset({
          exercises: [
            generateTrainingExercise({
              id: 'e1',
              methodId: 'm1',
              sets: [
                generateExerciseSet(1, {
                  reps: 4,
                  loadKg: 50,
                  tempoEcc: 4,
                  tempoIso: 1,
                  tempoCon: 3,
                  tempoIdle: 0,
                  recTime: 50,
                }),
              ],
            }),
          ],
        }),
      ],
    });

    it('should not throw error if no method is on training exercise', () => {
      const copyTrainingComponent = structuredClone(trainingComponent);
      copyTrainingComponent.supersets[0].exercises[0].methodId = undefined;

      expect(() =>
        service.validateSupersets(copyTrainingComponent, data),
      ).not.toThrow(); // If no error is thrown, the test passes
    });

    it('should throw error if invalid method is provided', () => {
      const copyTrainingComponent = structuredClone(trainingComponent);
      copyTrainingComponent.supersets[0].exercises[0].methodId =
        'invalidMethodId';

      expect(() => {
        service.validateSupersets(copyTrainingComponent, data);
      }).toThrow('Method not found');
    });

    it('should throw error if attribute value is out of range', () => {
      expect(() => {
        service.validateSupersets(trainingComponent, data);
      }).toThrow(
        'Number of sets cannot be less than 3 for method Method1 (and 3 more errors)',
      );
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
      service.validateSupersets(trainingComponent, data),
    ).not.toThrow();
  });
});
