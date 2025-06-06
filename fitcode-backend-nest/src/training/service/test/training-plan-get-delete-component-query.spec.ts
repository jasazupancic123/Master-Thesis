import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../../common/common.module';
import { validationSchema } from '../../../config/environment-validation-schema';
import { TrainingPlanService } from '../training-plan.service';
import { ComponentService } from '../../../component/component.service';
import {
  generateTrainingComponent,
  generateTrainingStub,
} from '../../mock/training.stub';
import { createMock } from '@golevelup/ts-jest';
import { AttributeService } from '../../../attribute/service/attribute.service';
import { ExerciseService } from '../../../exercise/service/exercise.service';
import { ExerciseAttributeValueRepository } from '../../../exercise/repository/exercise-attribute-value.repository';
import { AttributeRepository } from '../../../attribute/repository/attribute.repository';
import { Training } from '../../entity/training.entity';

describe('getDeleteComponentQuery', () => {
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
    exerciseService = moduleRef.get(ExerciseService);
  });
  it('should return a correct training and a correct trainingRef', () => {
    const components = [
      generateTrainingComponent({ id: 'component-id-1' }),
      generateTrainingComponent({ id: 'component-id-2' }),
      generateTrainingComponent({ id: 'component-id-3' }),
    ];
    const trainingStub = generateTrainingStub({
      id: 'training-id',
      groupId: 'group-id',
      cycleId: 'cycle-id',
      ownerId: 'owner-id',
      membersIds: [],
      components,
    });

    const result = service.getDeleteComponentQuery(trainingStub, {
      trainingId: 'training-id',
      componentId: 'component-id-2',
    });

    expect(result.length).toBe(2);
    const query = result[0] as Training;
    const training = result[1];

    expect(query.components).toEqual(
      components.filter((c) => c.id !== 'component-id-2'),
    );
    expect(training.components).toEqual(
      components.filter((c) => c.id !== 'component-id-2'),
    );
  });
});
