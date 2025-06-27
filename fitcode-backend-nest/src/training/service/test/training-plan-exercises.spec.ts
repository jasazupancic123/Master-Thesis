import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../../common/common.module';
import { validationSchema } from '../../../config/environment-validation-schema';
import { TrainingPlanService } from '../training-plan.service';
import { ComponentService } from '../../../component/component.service';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '../../mock/training.stub';
import { createMock } from '@golevelup/ts-jest';
import { AttributeService } from '../../../attribute/service/attribute.service';
import { ExerciseService } from '../../../exercise/service/exercise.service';
import { ExerciseAttributeValueRepository } from '../../../exercise/repository/exercise-attribute-value.repository';
import { AttributeRepository } from '../../../attribute/repository/attribute.repository';
import { Method } from '../../../method/entity/method.entity';
import { FirebaseService } from '../../../firebase/firebase.service';
import { WorkloadRepository } from '../../../training/repository/workload.repository';
import { WorkloadService } from '../workload.service';
import { CacheManagerService } from '../../../cache-manager/cache-manager.service';
import { InstitutionService } from '../../../institution/service/institution.service';

describe('validateTrainingExerciseValues', () => {
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
    exerciseService = moduleRef.get(ExerciseService);
  });

  const MIN_SET = 5;
  const MAX_SET = 10;
  const MIN_REP = 3;
  const MAX_REP = 12;

  const trainingComponent = generateTrainingComponent({
    id: 'c1',
    methodId: 'm1',
    supersets: [
      generateSuperset({
        exercises: [
          generateTrainingExercise({
            sets: [
              generateExerciseSet({
                paramValuesL: [
                  {
                    field: 'vol1',
                    value: '12',
                    selected: 'rep',
                  },
                  {
                    field: 'int1',
                    value: '20',
                    selected: '',
                  },
                  {
                    field: 'volWorkSets',
                    value: '3',
                    selected: 'set',
                  },
                ],
                paramValuesR: [
                  {
                    field: 'vol1',
                    value: '12',
                    selected: 'rep',
                  },
                  {
                    field: 'int1',
                    value: '20',
                    selected: '',
                  },
                  {
                    field: 'volWorkSets',
                    value: '3',
                    selected: 'set',
                  },
                ],
              }),
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
      attributeRanges: [
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
      intensity: '100%',
      tempo: '1',
      recovery: '60',
      targetId: 'power',
    },
    {
      id: 'm2',
      name: 'Method2',
      ability: 'Ability2',
      attributeRanges: [
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
      intensity: '100%',
      tempo: '1',
      recovery: '60',
      targetId: 'power',
    },
  ] as Method[];

  it('should not throw error if no method is on training component', () => {
    const copyTrainingComponent = { ...trainingComponent };
    copyTrainingComponent.methodId = undefined;

    expect(() =>
      service.validateTrainingExerciseValues(copyTrainingComponent, methods),
    ).not.toThrow(); // If no error is thrown, the test passes
  });

  it('should throw error if invalid method is provided', () => {
    const copyTrainingComponent = { ...trainingComponent };
    copyTrainingComponent.methodId = 'invalidMethodId';

    expect(() => {
      service.validateTrainingExerciseValues(copyTrainingComponent, methods);
    }).toThrow('Method not found for training component');
  });

  it('should throw error if attribute value is out of range', () => {
    expect(() => {
      service.validateTrainingExerciseValues(trainingComponent, methods);
    }).toThrow(`Value for volWorkSets cannot be less than ${MIN_SET}`);
  });

  it('should successfully validate exercise values', () => {
    const copyTrainingComponent = { ...trainingComponent };
    copyTrainingComponent.methodId = 'm2';

    expect(() =>
      service.validateTrainingExerciseValues(copyTrainingComponent, methods),
    ).not.toThrow(); // If no error is thrown, the test passes
  });
});
