import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import type { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeRepository } from '@src/attribute/repository/attribute.repository';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import type { ComponentParam } from '@src/component/entity/component-param.entity';
import {
  IntType,
  ParamType,
  VolWorkSetType,
} from '@src/component/enum/param.enum';
import { ComponentRepository } from '@src/component/repository/component.repository';
import { validationSchema } from '@src/config/environment-validation-schema';
import { ExerciseAttributeValueRepository } from '@src/exercise/repository/exercise-attribute-value.repository';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

describe('getSetData', () => {
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
          provide: ComponentRepository,
          useValue: createMock<ComponentRepository>,
        },
        ComponentService,
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

    const params = componentService.getParamAttributes(componentParams);
    const result = service.getSets(params);

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

    const params = componentService.getParamAttributes(componentParams);
    const result = service.getSets(params);

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

    const params = componentService.getParamAttributes(componentParams);
    const result = service.getSets(params, paramValues);

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

    const params = componentService.getParamAttributes(componentParams);
    const result = service.getSets(params);

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

    const params = componentService.getParamAttributes(componentParams);
    const result = service.getSets(params);

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
    const result = service.getSets([]);
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

    const params = componentService.getParamAttributes(componentParams);
    const result = service.getSets(params);

    expect(result.length).toBe(1);
    for (const paramValues of [result[0].paramValuesL, result[0].paramValuesR])
      expect(paramValues).toEqual([
        { field: ParamType.IntWork1, selected: IntType.Kg, value: '20' },
      ]);
  });
});
