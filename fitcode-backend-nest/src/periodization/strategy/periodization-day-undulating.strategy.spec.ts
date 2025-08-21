import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TestPeriodizationUtil } from '@test/common/utils/periodization.util';

import { CommonModule } from '@src/common/common.module';
import type { TrainingComponentRef } from '@src/common/type/firestore.type';
import { validationSchema } from '@src/config/environment-validation-schema';
import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import { PeriodizationModule } from '../periodization.module';
import { PeriodizationService } from '../periodization.service';

const ref: TrainingComponentRef = {
  trainingId: TestPeriodizationUtil.TRAININGS[0].id, // periodize the first "base" training
  componentId: 'c1',
};

const EXPECTED_VALUES = [
  { int: 20, vol: 12 },
  { int: 22, vol: 11 },
  { int: 20, vol: 12 },
  { int: 22, vol: 11 },
  { int: 20, vol: 12 },
  { int: 20, vol: 12 },
];

describe('DayUndulatingPeriodizationStrategy', () => {
  const type = PeriodizationType.DAY_UNDULATING;
  let service: PeriodizationService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema }),
        CommonModule,
        PeriodizationModule,
      ],
      providers: [PeriodizationService],
    }).compile();

    service = moduleRef.get(PeriodizationService);
  });

  it('should periodize a training with day undulating strategy', async () => {
    const result = service.periodize(
      type,
      ref,
      TestPeriodizationUtil.TRAININGS,
    );

    expect(result).toHaveLength(TestPeriodizationUtil.TRAININGS.length);

    for (let i = 1; i < result.length; i++) {
      const training = result[i];
      TestPeriodizationUtil.expectExerciseSetValueToBe(
        training,
        { ...ref, exerciseId: 'e1', supersetIndex: 0, setIndex: 0 },
        ({ intL, volL, intR, volR }) => {
          expect(intL).toBe(EXPECTED_VALUES[i].int);
          expect(volL).toBe(EXPECTED_VALUES[i].vol);
          expect(intR).toBe(EXPECTED_VALUES[i].int);
          expect(volR).toBe(EXPECTED_VALUES[i].vol);
        },
      );
    }
  });
});
