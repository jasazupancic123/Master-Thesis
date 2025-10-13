import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { ComponentRepository } from '@src/component/repository/component.repository';
import { validationSchema } from '@src/config/environment-validation-schema';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
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
        ExerciseAttributeService,
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
});
