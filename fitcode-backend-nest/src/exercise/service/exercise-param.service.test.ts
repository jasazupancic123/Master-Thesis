import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeModule } from '@src/attribute/attribute.module';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { validationSchema } from '@src/config/environment-validation-schema';
import { LoadType } from '@src/training/enum/load-type.enum';
import { TrainingPlanService } from '@src/training/service/training-plan.service';

import { ExerciseParam } from '../constant/exercise-param.constant';
import { generateExerciseStub } from '../mock/exercise.stub';
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

  const data = {
    exercises,
    components: [root],
    methods: [],
    attributes: [],
  };

  it('should correctly populate exercise parameters', () => {
    const isUnilateral = true;
    const component = generateComponentStub({ params: ['loadKg', 'eff'] });

    componentService.getRoot = jest.fn().mockReturnValue(component);
    const setParams = service.getSetParams(isUnilateral, component.params);

    expect(setParams.reps).toBe(ExerciseParam.REPS.defaultValue);
    expect(setParams.repsR).toBe(ExerciseParam.REPS.defaultValue);
    expect(setParams.loadKg).toBe(ExerciseParam.KG.defaultValue);
    expect(setParams.loadKgR).toBe(ExerciseParam.KG.defaultValue);
    expect(setParams.eff).toBe(ExerciseParam.EFF.defaultValue);
    expect(setParams.loadType).toBe(LoadType.Kg);
    expect(setParams.loadRm).toBeUndefined();
    expect(setParams.loadRmR).toBeUndefined();
    expect(setParams.loadBw).toBeUndefined();
    expect(setParams.loadBwR).toBeUndefined();
    expect(setParams.tempo).toBeUndefined();
    expect(setParams.tempoR).toBeUndefined();
    expect(setParams.vel).toBeUndefined();
    expect(setParams.velR).toBeUndefined();
    expect(setParams.recTime).toBeUndefined();
    expect(setParams.time).toBeUndefined();
    expect(setParams.dist).toBeUndefined();
    expect(setParams.recDist).toBeUndefined();
  });
});
