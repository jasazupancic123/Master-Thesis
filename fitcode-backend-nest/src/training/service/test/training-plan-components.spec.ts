import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../../common/common.module';
import { validationSchema } from '../../../config/environment-validation-schema';
import { TrainingPlanService } from '../training-plan.service';
import { ComponentService } from '../../../component/component.service';
import { generateComponentStub } from '../../../component/mock/component.stub';
import { generateExerciseStub } from '../../../exercise/mock/exercise.stub';
import {
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '../../mock/training.stub';
import { createMock } from '@golevelup/ts-jest';
import { AttributeService } from '../../../attribute/service/attribute.service';
import { ExerciseService } from '../../../exercise/service/exercise.service';
import { ExerciseAttributeValueRepository } from '../../../exercise/repository/exercise-attribute-value.repository';
import { AttributeRepository } from '../../../attribute/repository/attribute.repository';
import {
  COOLDOWN_COMPONENT,
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT,
  WARMUP_COMPONENT_ID,
} from '../../../component/constant/warmup-cooldown.constant';
import { addMinutes, subMinutes } from 'date-fns';
import { FirebaseService } from '../../../firebase/firebase.service';
import { WorkloadRepository } from '../../../training/repository/workload.repository';
import { WorkloadService } from '../workload.service';
import { CacheManagerService } from '../../../cache-manager/cache-manager.service';
import { InstitutionService } from '../../../institution/service/institution.service';

describe('validateTrainingComponents', () => {
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

  const components = [
    WARMUP_COMPONENT,
    generateComponentStub({ id: 'c1', name: 'Component 1' }),
    generateComponentStub({ id: 'c2', name: 'Component 2' }),
    generateComponentStub({ id: 'c3', name: 'Component 3' }),
    generateComponentStub({ id: 'c4' }),
    generateComponentStub({ id: 'c5' }),
    generateComponentStub({ id: 'c6' }),
    generateComponentStub({ id: 'leaf1', parentId: 'c1', name: 'Leaf 1' }),
    generateComponentStub({ id: 'leaf2', parentId: 'c1', name: 'Leaf 2' }),
    generateComponentStub({ id: 'leaf3', parentId: 'c2', name: 'Leaf 3' }),
    COOLDOWN_COMPONENT,
  ];

  const exercises = [
    generateExerciseStub({ id: 'e1', componentIds: ['leaf1'] }),
    generateExerciseStub({ id: 'e2', componentIds: ['leaf1'] }),
    generateExerciseStub({ id: 'e3', componentIds: ['leaf2'] }),
    generateExerciseStub({ id: 'e4', componentIds: ['leaf3'] }),
    generateExerciseStub({ id: 'e5', componentIds: ['leaf3'] }),
  ];

  beforeEach(() => {
    jest
      .spyOn(componentService, 'leafsFromFlat')
      .mockReturnValue(components.filter((c) => c.id.includes('leaf')));

    jest
      .spyOn(componentService, 'getRoot')
      .mockImplementation((leaf, allComponents) => {
        return allComponents.find((c) => c.id === leaf.parentId) || leaf;
      });
  });

  it('should throw error if there is no warmup component', () => {
    const trainingComponents = [generateTrainingComponent({ id: 'c1' })];

    expect(() =>
      service.validateTrainingComponents(
        [],
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow('Training must have warmup component');
  });

  it('should throw error if there is no cooldown component', () => {
    const trainingComponents = [
      generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
      generateTrainingComponent({ id: 'c1' }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow('Training must have cooldown component');
  });

  it('should throw error if component does not exist', () => {
    const trainingComponents = [
      generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
      generateTrainingComponent({ id: 'invalid-component-id' }),
      generateTrainingComponent({ id: COOLDOWN_COMPONENT_ID }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow('Component does not exist');
  });

  it('should throw error if component is not root', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({ id: 'leaf1', from: now }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow(`Component Leaf 1 cannot be selected for training`);
  });

  it('should throw error if there are duplicate components', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({ id: 'c1', from: now }),
      generateTrainingComponent({ id: 'c2', from: addMinutes(now, 5) }),
      generateTrainingComponent({ id: 'c3', from: addMinutes(now, 10) }),
      generateTrainingComponent({ id: 'c1', from: addMinutes(now, 15) }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 20),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow(`Duplicate component Component 1`);
  });

  it('should throw error if component times are invalid', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({ id: 'c1', from: now }),
      generateTrainingComponent({ id: 'c2', from: now }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 20),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow(`Component Component 1 has to start before Component 2`);
  });

  // NOTE - disabled functionality (for now)
  /* it('should throw error if wrong exercises is provided', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({
        id: 'c1',
        from: now,
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'e1' }), // leaf1 -> c1
              generateTrainingExercise({ id: 'e2' }), // leaf1 -> c1
              generateTrainingExercise({ id: 'e4' }), // leaf3 -> c2, NOT ALLOWED
            ],
          }),
        ],
      }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 5),
      }),
    ];

    const exercise = exercises.find((e) => e.id === 'e4');

    expect(() =>
      service.validateTrainingComponents(
        exercises.filter((e) => ['e1', 'e2', 'e4'].includes(e.id)),
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow(
      `Exercise ${exercise?.name} cannot be part of selected component`,
    );
  }); */

  it('should throw error if there is an invalid member in subgroup', () => {
    const memberIds = ['m1', 'm2', 'm3'];
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({
        id: 'c1',
        from: now,
        subgroups: [
          generateSubgroup({ membersIds: ['m1', 'm2'] }),
          generateSubgroup({ membersIds: ['m3'] }),
          generateSubgroup({ membersIds: ['invalid-member'] }),
        ],
      }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        memberIds,
        trainingComponents,
        components,
        [],
      ),
    ).toThrow('Invalid member');
  });

  it('should throw error if some member is in multiple subgroups simultaneously', () => {
    const memberIds = ['m1', 'm2', 'm3'];
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({
        id: 'c1',
        from: now,
        subgroups: [
          generateSubgroup({ membersIds: ['m1', 'm2'] }),
          generateSubgroup({ membersIds: ['m3', 'm1'] }),
        ],
      }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        memberIds,
        trainingComponents,
        components,
        [],
      ),
    ).toThrow('Member cannot be part of multiple subgroups simultaneously');
  });

  it('should throw error if there are more than 5 components', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({ id: 'c1', from: now }),
      generateTrainingComponent({ id: 'c2', from: addMinutes(now, 5) }),
      generateTrainingComponent({ id: 'c3', from: addMinutes(now, 10) }),
      generateTrainingComponent({ id: 'c4', from: addMinutes(now, 15) }),
      generateTrainingComponent({ id: 'c5', from: addMinutes(now, 20) }),
      generateTrainingComponent({ id: 'c6', from: addMinutes(now, 25) }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 30),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        [],
        [],
        trainingComponents,
        components,
        [],
      ),
    ).toThrow('You can only have up to 5 components per training');
  });

  it('should not throw error for valid training components', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_COMPONENT_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({
        id: 'c1',
        from: now,
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'e1' }),
              generateTrainingExercise({ id: 'e2' }),
            ],
          }),
        ],
        subgroups: [
          generateSubgroup({
            membersIds: ['m1'],
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e1' })],
              }),
            ],
          }),
        ],
      }),
      generateTrainingComponent({
        id: COOLDOWN_COMPONENT_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(
        exercises.filter((e) => e.id !== 'e5'), // remove invalid exercise
        ['m1'],
        trainingComponents,
        components,
        [],
      ),
    ).not.toThrow();
  });
});
