import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { ComponentRepository } from '@src/component/repository/component.repository';
import { validationSchema } from '@src/config/environment-validation-schema';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { ExerciseParam } from '@src/training/constant/exercise-param.constant';
import { LoadType } from '@src/training/enum/load-type.enum';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { ExerciseParamService } from '../exercise-param.service';
import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

describe('TrainingPlanService (unit)', () => {
  let service: TrainingPlanService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let exerciseParamService: ExerciseParamService;

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
        ExerciseParamService,
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
    exerciseParamService = moduleRef.get(ExerciseParamService);
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
    const isUnilateral = true;
    const component = generateComponentStub({ params: ['loadKg', 'eff'] });

    componentService.getRoot = jest.fn().mockReturnValue(component);
    const setParams = exerciseParamService.getSetParams(
      isUnilateral,
      component.params,
    );

    expect(setParams.reps).toBe(ExerciseParam.REPS.defaultValue);
    expect(setParams.repsR).toBe(ExerciseParam.REPS.defaultValue);
    expect(setParams.loadKg).toBe(ExerciseParam.KG.defaultValue);
    expect(setParams.loadKgR).toBe(ExerciseParam.KG.defaultValue);
    expect(setParams.eff).toBe(ExerciseParam.EFF.defaultValue);
    expect(setParams.loadType).toBe(LoadType.Kg);
    expect(setParams.loadRm).toBeUndefined();
    expect(setParams.loadRmR).toBeUndefined();
    expect(setParams.loadBw).toBeUndefined();
    expect(setParams.loadBwR).toBeUndefined();
    expect(setParams.tempo).toBeUndefined();
    expect(setParams.tempoR).toBeUndefined();
    expect(setParams.vel).toBeUndefined();
    expect(setParams.velR).toBeUndefined();
    expect(setParams.recTime).toBeUndefined();
    expect(setParams.time).toBeUndefined();
    expect(setParams.dist).toBeUndefined();
    expect(setParams.recDist).toBeUndefined();
  });
});
