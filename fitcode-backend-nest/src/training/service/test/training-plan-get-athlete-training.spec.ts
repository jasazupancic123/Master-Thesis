import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeRepository } from '@src/attribute/repository/attribute.repository';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { ComponentRepository } from '@src/component/repository/component.repository';
import { validationSchema } from '@src/config/environment-validation-schema';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import {
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

describe('getTrainingByAthlete', () => {
  let service: TrainingPlanService;

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
        {
          provide: AttributeService,
          useValue: createMock<AttributeService>(),
        },
        {
          provide: ComponentRepository,
          useValue: createMock<ComponentRepository>,
        },
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
  });

  const training = generateTrainingStub({
    ownerId: 'owner',
    membersIds: ['a', 'b', 'c'],
    components: [
      generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [generateTrainingExercise({ id: 'e1' })],
          }),
        ],
        subgroups: [
          generateSubgroup({
            id: 'sg1',
            membersIds: ['a', 'b'],
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e2' })],
              }),
            ],
          }),
          generateSubgroup({
            id: 'sg1.1',
            parentId: 'sg1',
            membersIds: ['a'],
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e3' })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  it.each([
    ['a', 'e3'],
    ['b', 'e2'],
    ['c', 'e1'],
  ])(
    'should return training for athlete %s',
    (athleteId, expectedExerciseId) => {
      const result = service.getTrainingByAthlete(athleteId, training);
      expect(result.components[0].subgroups).toHaveLength(0);
      expect(result.membersIds).toHaveLength(1);
      expect(result.membersIds[0]).toBe(athleteId);
      expect(result.components[0].supersets[0].exercises[0].id).toBe(
        expectedExerciseId,
      );
    },
  );
});
