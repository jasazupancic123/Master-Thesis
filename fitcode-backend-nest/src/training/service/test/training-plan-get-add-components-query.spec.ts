import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../../common/common.module';
import { validationSchema } from '../../../config/environment-validation-schema';
import { TrainingPlanService } from '../training-plan.service';
import { ComponentService } from '../../../component/component.service';
import {
  generateTrainingStub,
  generateTrainingComponent,
} from '../../mock/training.stub';
import { createMock } from '@golevelup/ts-jest';
import { AttributeService } from '../../../attribute/service/attribute.service';
import { ExerciseService } from '../../../exercise/service/exercise.service';
import { ExerciseAttributeValueRepository } from '../../../exercise/repository/exercise-attribute-value.repository';
import { AttributeRepository } from '../../../attribute/repository/attribute.repository';
import { Training } from '../../entity/training.entity';

describe('getAddComponentsQuery', () => {
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
  it('should return a correct query and a correct training', () => {
    const components = [
      generateTrainingComponent(),
      generateTrainingComponent(),
    ];
    const trainingStub = generateTrainingStub({
      id: 'training-id',
      groupId: 'group-id',
      cycleId: 'cycle-id',
      ownerId: 'owner-id',
      membersIds: [],
      components,
    });
    const newComponent = generateTrainingComponent({
      id: 'new-component-id',
      from: new Date(),
      to: new Date(),
    });
    const result = service.getAddComponentsQuery(trainingStub, [newComponent]);

    expect(result.length).toBe(2);

    const query = result[0];
    const training = result[1] as Training;

    expect(query.components).toEqual([...trainingStub.components]);
    expect(training.components).toEqual([...trainingStub.components]);
  });
});
