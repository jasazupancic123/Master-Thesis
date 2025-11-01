import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { validationSchema } from '@src/config/environment-validation-schema';
import { generateComponentStub } from '@src/exercise/mock/component.stub';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { MainSet } from '@src/training/enum/main-set.enum';
import {
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

describe('copySubgroup', () => {
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
        {
          provide: AttributeService,
          useValue: createMock<AttributeService>(),
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
    generateExerciseStub({ id: 'e1', components: ['leaf1'] }),
    generateExerciseStub({ id: 'e2', components: ['leaf1'] }),
    generateExerciseStub({ id: 'e3', components: ['leaf2'] }),
    generateExerciseStub({ id: 'e4', components: ['leaf3'] }),
    generateExerciseStub({ id: 'e5', components: ['leaf3'] }),
    generateExerciseStub({ id: 'e6', components: ['leaf3'] }),
    generateExerciseStub({ id: 'e7', components: ['leaf3'] }),
    generateExerciseStub({ id: 'e8', components: ['leaf3'] }),
    generateExerciseStub({ id: 'e9', components: ['leaf3'] }),
  ];

  const data = { exercises, components: [root], methods: [], attributes: [] };

  it('should pass if training component has different mainSet than subgroup', () => {
    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      mainSet: MainSet.BLOCK,
      supersets: [
        generateSuperset({
          exercises: [
            generateTrainingExercise({ id: 'e1' }),
            generateTrainingExercise({ id: 'e2' }),
            generateTrainingExercise({ id: 'e3' }),
          ],
        }),
        generateSuperset({
          exercises: [
            generateTrainingExercise({ id: 'e4' }),
            generateTrainingExercise({ id: 'e5' }),
            generateTrainingExercise({ id: 'e6' }),
          ],
        }),
        generateSuperset({
          exercises: [
            generateTrainingExercise({ id: 'e7' }),
            generateTrainingExercise({ id: 'e8' }),
            generateTrainingExercise({ id: 'e9' }),
          ],
        }),
      ],
      subgroups: [
        generateSubgroup({
          id: 'sg1',
          mainSet: MainSet.CIRCUIT,
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'e1' }),
                generateTrainingExercise({ id: 'e2' }),
                generateTrainingExercise({ id: 'e3' }),
                generateTrainingExercise({ id: 'e4' }),
                generateTrainingExercise({ id: 'e5' }),
                generateTrainingExercise({ id: 'e6' }),
              ],
            }),
          ],
        }),
        generateSubgroup({
          id: 'sg1',
          mainSet: MainSet.BLOCK,
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'e1' }),
                generateTrainingExercise({ id: 'e2' }),
                generateTrainingExercise({ id: 'e3' }),
                generateTrainingExercise({ id: 'e4' }),
              ],
            }),
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
      service.validateSubgroups(trainingComponent, [], data),
    ).not.toThrow();
  });
});
