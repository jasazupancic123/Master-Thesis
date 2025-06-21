import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../../common/common.module';
import { validationSchema } from '../../../config/environment-validation-schema';
import { TrainingPlanService } from '../training-plan.service';
import { ComponentService } from '../../../component/component.service';
import {
  IntType,
  ParamType,
  VolWorkSetType,
} from '../../../component/enum/param.enum';
import { ComponentParam } from '../../../component/entity/component-param.entity';
import { AttributeValue } from '../../../attribute/entity/attribute-value.entity';
import { createMock } from '@golevelup/ts-jest';
import { AttributeService } from '../../../attribute/service/attribute.service';
import { ExerciseService } from '../../../exercise/service/exercise.service';
import { ExerciseAttributeValueRepository } from '../../../exercise/repository/exercise-attribute-value.repository';
import { AttributeRepository } from '../../../attribute/repository/attribute.repository';
import { FirebaseService } from '../../../firebase/firebase.service';
import { WorkloadRepository } from '../../../training/repository/workload.repository';
import { WorkloadService } from '../workload.service';
import { CacheManagerService } from '../../../cache-manager/cache-manager.service';

describe('getSetData', () => {
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

  it('should create correct number of sets based on VolWorkSets parameter', () => {
    const componentParams: ComponentParam[] = [
      {
        field: ParamType.VolWorkSets,
        options: [
          {
            field: VolWorkSetType.Set,
            defaultValue: '3',
          },
        ],
      },
      {
        field: ParamType.IntWork1,
        options: [
          {
            field: IntType.Kg,
            defaultValue: '20',
          },
        ],
      },
    ];

    const params = service.getParamAttributes(componentParams);
    const result = service.getSetData(params);

    expect(result.length).toBe(3);
    expect(result[0].setNumber).toBe(1);
    expect(result[1].setNumber).toBe(2);
    expect(result[2].setNumber).toBe(3);

    // Each set should have the correct param values
    result.forEach((set) => {
      for (const paramValues of [set.paramValuesL, set.paramValuesR])
        expect(paramValues).toEqual([
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
        ]);
    });
  });

  it('should create 1 set by default when VolWorkSets parameter is not provided', () => {
    const componentParams: ComponentParam[] = [
      {
        field: ParamType.IntWork1,
        options: [
          {
            field: IntType.Kg,
            defaultValue: '20',
          },
        ],
      },
    ];

    const params = service.getParamAttributes(componentParams);
    const result = service.getSetData(params);

    expect(result.length).toBe(1);
    expect(result[0].setNumber).toBe(1);

    expect(result[0].paramValuesL).toEqual([
      { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
    ]);

    expect(result[0].paramValuesR).toEqual([
      { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
    ]);
  });

  it('should create sets with provided paramValues when available', () => {
    const componentParams: ComponentParam[] = [
      {
        field: ParamType.VolWorkSets,
        options: [
          {
            field: VolWorkSetType.Set,
            defaultValue: '2',
          },
        ],
      },
      {
        field: ParamType.IntWork1,
        options: [
          {
            field: IntType.Kg,
            defaultValue: '20',
          },
        ],
      },
    ];

    const paramValues: AttributeValue[] = [
      {
        field: ParamType.IntWork1,
        selected: IntType.Kg,
        value: '25',
      },
    ];

    const params = service.getParamAttributes(componentParams);
    const result = service.getSetData(params, paramValues);

    expect(result.length).toBe(2);
    result.forEach((set) => {
      for (const paramValues of [set.paramValuesL, set.paramValuesR])
        expect(paramValues).toEqual([
          { field: ParamType.IntWork1, selected: IntType.Kg, value: '25' },
        ]);
    });
  });

  it('should handle nested parameter options correctly', () => {
    const componentParams: ComponentParam[] = [
      {
        field: ParamType.VolWorkSets,
        options: [
          {
            field: VolWorkSetType.Set,
            defaultValue: '1',
          },
        ],
      },
      {
        field: ParamType.IntWork1,
        options: [
          {
            field: IntType.Eff,
            options: [{ field: '2', defaultValue: '2' }],
          },
        ],
      },
    ];

    const params = service.getParamAttributes(componentParams);
    const result = service.getSetData(params);

    expect(result.length).toBe(1);

    for (const paramValues of [result[0].paramValuesL, result[0].paramValuesR])
      expect(paramValues).toEqual([
        {
          field: ParamType.IntWork1,
          selected: `${IntType.Eff}:2`,
          value: '2',
        },
      ]);
  });

  it('should filter out VolWorkSets from the param values', () => {
    const componentParams: ComponentParam[] = [
      {
        field: ParamType.VolWorkSets,
        options: [
          {
            field: VolWorkSetType.Set,
            defaultValue: '1',
          },
        ],
      },
      {
        field: ParamType.IntWork1,
        options: [
          {
            field: IntType.Kg,
            defaultValue: '20',
          },
        ],
      },
    ];

    const params = service.getParamAttributes(componentParams);
    const result = service.getSetData(params);

    for (const paramValues of [
      result[0].paramValuesL,
      result[0].paramValuesR,
    ]) {
      expect(paramValues).not.toContainEqual(
        expect.objectContaining({ field: ParamType.VolWorkSets }),
      );

      expect(paramValues).toEqual([
        { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
      ]);
    }
  });

  it('should handle empty params array', () => {
    const result = service.getSetData([]);
    expect(result.length).toBe(1); // Default 1 set
    expect(result[0].paramValuesL).toEqual([]); // No params to include
    expect(result[0].paramValuesR).toEqual([]); // No params to include
  });

  it('should handle params without options', () => {
    const componentParams: ComponentParam[] = [
      {
        field: ParamType.IntWork1,
        defaultValue: '30',
      },
    ];

    const params = service.getParamAttributes(componentParams);
    const result = service.getSetData(params);

    expect(result.length).toBe(1);
    for (const paramValues of [result[0].paramValuesL, result[0].paramValuesR])
      expect(paramValues).toEqual([
        { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
      ]);
  });
});
