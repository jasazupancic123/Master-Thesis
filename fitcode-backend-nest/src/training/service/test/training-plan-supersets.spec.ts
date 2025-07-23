import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeRepository } from '@src/attribute/repository/attribute.repository';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { validationSchema } from '@src/config/environment-validation-schema';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseAttributeValueRepository } from '@src/exercise/repository/exercise-attribute-value.repository';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import {
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
  });

  beforeEach(() => {
    jest
      .spyOn(componentService, 'getRoot')
      .mockImplementation((leaf, allComponents) => {
        return allComponents.find((c) => c.id === leaf.parentId) || leaf;
      });
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

  it('should throw error if there are more than 8 supersets in a training component', () => {
    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      supersets: Array.from({ length: 9 }, (_, i) =>
        generateSuperset({
          exercises: [generateTrainingExercise({ id: `e${i + 1}` })],
        }),
      ),
    });
    expect(() =>
      service.validateSupersets(trainingComponent, exercises),
    ).toThrow('You can only have up to 8 supersets per training component');
  });

  it('should throw error if there are more than 4 exercises in a superset', () => {
    const trainingComponent = generateTrainingComponent({
      id: 'c1',
      supersets: [
        generateSuperset({
          exercises: Array.from({ length: 5 }, (_, i) =>
            generateTrainingExercise({ id: `e${i + 1}` }),
          ),
        }),
      ],
    });
    expect(() =>
      service.validateSupersets(trainingComponent, exercises),
    ).toThrow('You can only have up to 4 exercises per superset');
  });

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
      service.validateSupersets(trainingComponent, exercises),
    ).toThrow('Training exercise not found');
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
      service.validateSupersets(trainingComponent, exercises),
    ).not.toThrow();
  });
});
