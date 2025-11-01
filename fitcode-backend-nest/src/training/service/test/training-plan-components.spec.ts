import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { addMinutes, subMinutes } from 'date-fns';

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
import { MAIN_GROUP_PARENT_ID } from '@src/training/constant/main-group-parent-id.constant';
import { MAX_NUM_COMPONENTS_IN_TRAINING } from '@src/training/constant/training-limits.constant';
import {
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

const WARMUP_ID = 'warmup';
const COOLDOWN_ID = 'cooldown';

// mock for attribute service to validate correct component roots
jest.mock('@src/exercise/constant/components.constant', () => ({
  WARMUP_ID: 'warmup',
  COOLDOWN_ID: 'cooldown',
  WARMUP: generateComponentStub({ field: 'warmup', name: 'Warmup' }),
  COOLDOWN: generateComponentStub({ field: 'cooldown', name: 'Cooldown' }),
  Components: [
    generateComponentStub({ field: 'warmup', name: 'Warmup' }),
    generateComponentStub({
      field: 'c1',
      name: 'Component 1',
      options: [generateComponentStub({ field: 'leaf1', name: 'Leaf 1' })],
    }),
    generateComponentStub({
      field: 'c2',
      name: 'Component 2',
      options: [generateComponentStub({ field: 'leaf2', name: 'Leaf 2' })],
    }),
    generateComponentStub({
      field: 'c3',
      name: 'Component 3',
      options: [generateComponentStub({ field: 'leaf3', name: 'Leaf 3' })],
    }),
    generateComponentStub({ field: 'c4' }),
    generateComponentStub({ field: 'c5' }),
    generateComponentStub({ field: 'c6' }),
    generateComponentStub({ field: 'cooldown', name: 'Cooldown' }),
  ],
}));

describe('validateTrainingComponents', () => {
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
        AttributeService,
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
  });

  const exercises = [
    generateExerciseStub({ id: 'e1', components: ['c1:leaf1'] }),
    generateExerciseStub({ id: 'e2', components: ['c1:leaf1'] }),
    generateExerciseStub({ id: 'e3', components: ['c1:leaf2'] }),
    generateExerciseStub({ id: 'e4', components: ['c1:leaf3'] }),
    generateExerciseStub({ id: 'e5', components: ['c1:leaf3'] }),
  ];

  const data = { exercises, methods: [] };

  it('should throw error if component does not exist', () => {
    const trainingComponents = [
      generateTrainingComponent({ id: WARMUP_ID }),
      generateTrainingComponent({ id: 'invalid-component-id' }),
      generateTrainingComponent({ id: COOLDOWN_ID }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, [], data),
    ).toThrow('Component does not exist');
  });

  it('should throw error if component is not root', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({ id: 'c1:leaf1', from: now }),
      generateTrainingComponent({
        id: COOLDOWN_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, [], data),
    ).toThrow(`Component cannot be selected for training`);
  });

  it('should throw error if there are duplicate components', () => {
    const trainingComponents = [
      generateTrainingComponent({ id: WARMUP_ID }),
      generateTrainingComponent({ id: 'c1' }),
      generateTrainingComponent({ id: 'c2' }),
      generateTrainingComponent({ id: 'c3' }),
      generateTrainingComponent({ id: 'c1' }),
      generateTrainingComponent({ id: COOLDOWN_ID }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, [], data),
    ).toThrow(`Duplicate component Component 1`);
  });

  it('should throw error if there is an invalid member in subgroup', () => {
    const memberIds = ['m1', 'm2', 'm3'];
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
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
        id: COOLDOWN_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, memberIds, data),
    ).toThrow('Invalid member');
  });

  it('should throw error if some member is in multiple subgroups simultaneously', () => {
    const memberIds = ['m1', 'm2', 'm3'];
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
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
        id: COOLDOWN_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, memberIds, data),
    ).toThrow('Member is already in another subgroup');
  });

  it('should throw error if there are more than 5 components', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({ id: 'c1', from: now }),
      generateTrainingComponent({ id: 'c2', from: addMinutes(now, 5) }),
      generateTrainingComponent({ id: 'c3', from: addMinutes(now, 10) }),
      generateTrainingComponent({ id: 'c4', from: addMinutes(now, 15) }),
      generateTrainingComponent({ id: 'c5', from: addMinutes(now, 20) }),
      generateTrainingComponent({ id: 'c6', from: addMinutes(now, 25) }),
      generateTrainingComponent({
        id: COOLDOWN_ID,
        from: addMinutes(now, 30),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, [], data),
    ).toThrow(
      `You can only have up to ${MAX_NUM_COMPONENTS_IN_TRAINING} components per training`,
    );
  });

  it('should not throw error for valid training components', () => {
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
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
        id: COOLDOWN_ID,
        from: addMinutes(now, 5),
      }),
    ];

    const data = {
      exercises: exercises.filter((e) => e.id !== 'e5'), // remove invalid exercise
      methods: [],
      attributes: [],
    };

    // jest.spyOn(componentService, 'getParamAttributes').mockReturnValue(PARAMS);

    expect(() =>
      service.validateTrainingComponents(trainingComponents, ['m1'], data),
    ).not.toThrow();
  });

  it('should throw error if subgroup is direct child of main component and does not have only 1 member', () => {
    const memberIds = ['m1', 'm2', 'm3'];
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({
        id: 'c1',
        from: now,
        subgroups: [
          generateSubgroup({
            membersIds: ['m1', 'm2'],
            parentId: MAIN_GROUP_PARENT_ID,
          }),
        ],
      }),
      generateTrainingComponent({
        id: COOLDOWN_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, memberIds, data),
    ).toThrow('Only one member can be selected');
  });

  it('should throw error if direct subgroup has member that is already in another subgroup', () => {
    const memberIds = ['m1', 'm2', 'm3'];
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
        from: subMinutes(now, 5),
      }),
      generateTrainingComponent({
        id: 'c1',
        from: now,
        subgroups: [
          generateSubgroup({
            membersIds: ['m1'],
            parentId: MAIN_GROUP_PARENT_ID,
          }),
          generateSubgroup({ membersIds: ['m1', 'm2'] }),
        ],
      }),
      generateTrainingComponent({
        id: COOLDOWN_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, memberIds, data),
    ).toThrow('Member is already in another subgroup');
  });

  it('should throw error if direct subgroup training prescription is different than main component', () => {
    const memberIds = ['m1', 'm2', 'm3'];
    const now = new Date();
    const trainingComponents = [
      generateTrainingComponent({
        id: WARMUP_ID,
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
            parentId: MAIN_GROUP_PARENT_ID,
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e1' })],
              }),
            ],
          }),
        ],
      }),
      generateTrainingComponent({
        id: COOLDOWN_ID,
        from: addMinutes(now, 5),
      }),
    ];

    expect(() =>
      service.validateTrainingComponents(trainingComponents, memberIds, data),
    ).toThrow(
      'Training prescription must be the same for all members in the selected group',
    );
  });
});
