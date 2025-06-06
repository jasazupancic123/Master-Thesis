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
  WARMUP_COMPONENT,
} from '../../../component/constant/warmup-cooldown.constant';

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
          provide: AttributeRepository,
          useValue: createMock<AttributeRepository>(),
        },
        AttributeService,
        {
          provide: ComponentService,
          useValue: createMock<ComponentService>(),
        },
        {
          provide: ExerciseService,
          useValue: createMock<ExerciseService>(),
        },
        {
          provide: ExerciseAttributeValueRepository,
          useValue: createMock<ExerciseAttributeValueRepository>(),
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

  const components = [
    WARMUP_COMPONENT,
    generateComponentStub({ id: 'c1', name: 'Component 1' }),
    generateComponentStub({ id: 'c2', name: 'Component 2' }),
    generateComponentStub({ id: 'c3', name: 'Component 3' }),
    generateComponentStub({ id: 'c4' }),
    generateComponentStub({ id: 'c5' }),
    generateComponentStub({ id: 'c6' }),
    generateComponentStub({
      id: 'leaf1',
      parentId: 'c1',
      name: 'Leaf 1',
    }),
    generateComponentStub({
      id: 'leaf2',
      parentId: 'c1',
      name: 'Leaf 2',
    }),
    generateComponentStub({
      id: 'leaf3',
      parentId: 'c1',
      name: 'Leaf 3',
    }),
    COOLDOWN_COMPONENT,
  ];

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
      service.validateSupersets(trainingComponent, exercises, components),
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
      service.validateSupersets(trainingComponent, exercises, components),
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
      service.validateSupersets(trainingComponent, exercises, components),
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
      service.validateSupersets(trainingComponent, exercises, components),
    ).not.toThrow();
  });
});
