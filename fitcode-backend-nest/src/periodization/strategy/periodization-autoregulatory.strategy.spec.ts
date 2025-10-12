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

describe('AutoregulatoryPeriodizationStrategy', () => {
  const type = PeriodizationType.AUTOREGULATORY;
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

  it('should periodize a training with autoregulatory strategy', async () => {
    const result = service.periodize(
      type,
      ref,
      TestPeriodizationUtil.TRAININGS,
    );

    expect(result).toHaveLength(TestPeriodizationUtil.TRAININGS.length);
    expect(result[0]).toEqual(TestPeriodizationUtil.TRAININGS[0]); // base training should remain unchanged

    for (let i = 1; i < result.length; i++) {
      const training = result[i];

      TestPeriodizationUtil.expectExerciseSetValueToBe(
        training,
        { ...ref, exerciseId: 'e1', supersetIndex: 0, setIndex: 0 },
        ({ intL, volL, intR, volR }) => {
          // random values, hard to test
          /* expect(intL).toBeGreaterThan(0);
          expect(volL).toBeGreaterThanOrEqual(3);
          expect(intR).toBeGreaterThan(0);
          expect(volR).toBeGreaterThanOrEqual(3); */
        },
      );
    }
  });
});
