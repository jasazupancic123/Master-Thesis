import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeModule } from '@src/attribute/attribute.module';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { validationSchema } from '@src/config/environment-validation-schema';
import { TrainingPlanService } from '@src/training/service/training-plan.service';

import type { ExerciseParamService } from './exercise-param.service';

describe('ExerciseParamService', () => {
  let service: ExerciseParamService;
  let componentService: ComponentService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema }),
        CommonModule,
        AttributeModule,
      ],
    }).compile();

    service = moduleRef.get(TrainingPlanService);
    componentService = moduleRef.get(ComponentService);
  });

  const root = generateComponentStub({ id: 'c1' });
  beforeEach(() => {
    jest.spyOn(componentService, 'getRoot').mockImplementation(() => root);
  });

  it('should correctly populate exercise parameters', () => {});
});
