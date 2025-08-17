import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { addDays } from 'date-fns';

import { CommonModule } from '@src/common/common.module';
import type { TrainingComponentRef } from '@src/common/type/firestore.type';
import { validationSchema } from '@src/config/environment-validation-schema';
import { PeriodizationType } from '@src/training/enum/periodization-type.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

import { PeriodizationModule } from './periodization.module';
import { PeriodizationService } from './periodization.service';

function generateTraining(addDaysFromToday: number) {
  return generateTrainingStub({
    ownerId: 'owner',
    membersIds: [],
    date: addDays(new Date(), addDaysFromToday),
    components: [
      generateTrainingComponent({
        id: 'c1',
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({
                id: 'e1',
                sets: [
                  generateExerciseSet(1),
                  generateExerciseSet(2),
                  generateExerciseSet(3),
                ],
              }),
              generateTrainingExercise({
                id: 'e2',
                sets: [
                  generateExerciseSet(1),
                  generateExerciseSet(2),
                  generateExerciseSet(3),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

const trainings = [
  // base training
  generateTraining(0),
  // additional trainings
  generateTraining(2),
  generateTraining(4),
  generateTraining(7),
  generateTraining(14),
  generateTraining(28),
];

const ref: TrainingComponentRef = {
  trainingId: trainings[0].id, // periodize the first "base" training
  componentId: 'c1',
};

describe('periodize', () => {
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

  it('should throw an error for unsupported periodization type', () => {
    const periodizationType = 'UNSUPPORTED' as PeriodizationType;

    expect(() =>
      service.periodize(periodizationType, ref, trainings, ['e1']),
    ).toThrow(`Periodization type ${periodizationType} not implemented`);
  });

  it('should not modify existing trainings', () => {
    const copiedTrainings = structuredClone(trainings);
    const result = service.periodize(
      PeriodizationType.LINEAR,
      ref,
      copiedTrainings,
      ['e1', 'e2'],
    );

    expect(copiedTrainings).toEqual(trainings);
    expect(result).not.toEqual(copiedTrainings);
  });

  it('should keep the base training unchanged and all others modified', () => {
    const result = service.periodize(PeriodizationType.LINEAR, ref, trainings, [
      'e1',
      'e2',
    ]);

    expect(result[0]).toEqual(trainings[0]);
    for (let i = 1; i < result.length; i++)
      expect(result[i]).not.toEqual(trainings[i]);
  });

  it.each([
    ['empty trainings and exercises', { trainings: [], exerciseIds: [] }],
    [
      'only base training without exercises',
      { trainings: [generateTraining(0)], exerciseIds: [] },
    ],
    [
      'multiple trainings without exercises',
      {
        trainings: [generateTraining(0), generateTraining(2)],
        exerciseIds: [],
      },
    ],
    [
      'empty trainings with one exercise',
      { trainings: [], exerciseIds: ['e1'] },
    ],
    [
      'base training with one exercise',
      {
        trainings: [generateTraining(0)],
        exerciseIds: ['e1'],
      },
    ],
  ])(
    'should return same result array if input is %s',
    (_, { trainings, exerciseIds }) => {
      const periodizationType = PeriodizationType.LINEAR;
      const result = service.periodize(
        periodizationType,
        ref,
        trainings,
        exerciseIds,
      );

      expect(result).toEqual(trainings);
    },
  );

  it('should return same result array if provided component is not found in base training', () => {
    const componentId = 'nonexistent';
    const periodizationType = PeriodizationType.LINEAR;

    const result = service.periodize(
      periodizationType,
      { ...ref, componentId },
      trainings,
      ['e1', 'e2'],
    );

    expect(result).toEqual(trainings);
  });
});
