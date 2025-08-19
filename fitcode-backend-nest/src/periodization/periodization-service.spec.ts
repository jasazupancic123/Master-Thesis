import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TestPeriodizationUtil } from '@test/common/utils/periodization.util';

import { CommonModule } from '@src/common/common.module';
import type { TrainingComponentRef } from '@src/common/type/firestore.type';
import { ParamType } from '@src/component/enum/param.enum';
import { generateComponentParamsStub } from '@src/component/mock/component-param.stub';
import { validationSchema } from '@src/config/environment-validation-schema';
import type { TrainingExercise } from '@src/training/entity/training-exercise.entity';
import { PeriodizationType } from '@src/training/enum/periodization-type.enum';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

import { PeriodizationModule } from './periodization.module';
import { PeriodizationService } from './periodization.service';
import type { PeriodizationResult } from './strategy/periodization.strategy';

const ref: TrainingComponentRef = {
  trainingId: TestPeriodizationUtil.TRAININGS[0].id, // periodize the first "base" training
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

  it('should not modify existing trainings', () => {
    const copiedTrainings = structuredClone(TestPeriodizationUtil.TRAININGS);
    const result = service.periodize(
      PeriodizationType.REPLICATE,
      ref,
      copiedTrainings,
      ['e1', 'e2'],
    );

    expect(copiedTrainings).toEqual(TestPeriodizationUtil.TRAININGS);
    expect(result).not.toBe(copiedTrainings); // checks for reference equality
  });

  it.each([
    [
      'empty trainings',
      { trainings: [], componentId: 'c1', subgroupId: undefined },
    ],
    [
      'only base training',
      {
        trainings: [TestPeriodizationUtil.generateTraining(0)],
        componentId: 'c1',
        subgroupId: undefined,
      },
    ],
    [
      'base training without provided component',
      {
        trainings: [TestPeriodizationUtil.generateTraining(0)],
        componentId: 'invalid',
        subgroupId: undefined,
      },
    ],
    [
      'base training with invalid subgroup',
      {
        trainings: [TestPeriodizationUtil.generateTraining(0)],
        componentId: 'c1',
        subgroupId: 'invalid',
      },
    ],
  ])(
    'should return same result array if input is %s',
    (_, { trainings, componentId, subgroupId }) => {
      const periodizationType = PeriodizationType.REPLICATE;
      const result = service.periodize(
        periodizationType,
        { ...ref, componentId, subgroupId },
        trainings,
      );

      expect(result).toEqual(trainings);
    },
  );

  it('should throw an error for unsupported periodization type', () => {
    const periodizationType = 'UNSUPPORTED' as PeriodizationType;

    expect(() =>
      service.periodize(
        periodizationType,
        ref,
        TestPeriodizationUtil.TRAININGS,
        ['e1'],
      ),
    ).toThrow(`Periodization type ${periodizationType} not implemented`);
  });

  it('should periodize all base training exercises if no exerciseIds provided', () => {
    const periodizationType = PeriodizationType.REPLICATE;
    const result = service.periodize(
      periodizationType,
      ref,
      TestPeriodizationUtil.TRAININGS,
    );

    expect(result.length).toBe(TestPeriodizationUtil.TRAININGS.length);

    const resultExercises = TestPeriodizationUtil.getExercises(result[0]);
    const baseExercises = TestPeriodizationUtil.getExercises(
      TestPeriodizationUtil.TRAININGS[0],
    );

    expect(resultExercises.length).toBe(baseExercises.length);

    for (let i = 1; i < result.length; i++) {
      const resultExercises = TestPeriodizationUtil.getExercises(result[i]);
      expect(resultExercises.length).toBe(baseExercises.length);
    }
  });

  it('should return same result array if provided exercises do not exist in base training', () => {
    const periodizationType = PeriodizationType.REPLICATE;

    const result = service.periodize(
      periodizationType,
      ref,
      TestPeriodizationUtil.TRAININGS,
      ['nonexistent', 'also-nonexistent'],
    );

    expect(result).toEqual(TestPeriodizationUtil.TRAININGS);
  });

  it('should not periodize upcoming training if component', () => {
    const periodizationType = PeriodizationType.LINEAR;

    const trainings = TestPeriodizationUtil.modifyTrainings();
    trainings[1].components[0].id = 'nonexistent'; // make sure component is not found

    const result = service.periodize(periodizationType, ref, trainings);
    expect(result).toHaveLength(trainings.length);
    for (let i = 0; i < result.length; i++) {
      if (i === 1) {
        // modified training should not have the periodized component
        expect(result[i].components[0].id).toBe('nonexistent');
        expect(result[i].components.find((c) => c.id === 'c1')).toBeUndefined();
      } else {
        expect(result[i].components.find((c) => c.id === 'c1')).toBeDefined();
      }
    }
  });

  it('should create new exercise in training if this option is provided', () => {
    const periodizationType = PeriodizationType.REPLICATE;

    // trainings that do not contain exercise 'e1'
    const trainings = TestPeriodizationUtil.modifyTrainings((t) => {
      t.components[0].supersets[0].exercises =
        t.components[0].supersets[0].exercises.filter((e) => e.id !== 'e1');

      return t;
    });

    const result = service.periodize(
      periodizationType,
      ref,
      trainings,
      ['e1'],
      { createExerciseIfNotExistsInTrainings: true },
    );

    expect(result).not.toEqual(trainings);

    // every periodized training should have exercise 'e1'
    for (let i = 1; i < result.length; i++) {
      const training = result[i];
      const exercises = TestPeriodizationUtil.getExercises(training, 1); // NOTE - exercise is moved to the next superset
      expect(exercises.some((e) => e.id === 'e1')).toBe(true);
    }
  });

  it('should not update int and vol values if exercise does not have such parameters', () => {
    function generateTraining() {
      const params = generateComponentParamsStub([
        ParamType.IntWork2,
        ParamType.VolWork2,
      ]);

      return generateTrainingStub({
        ownerId: 'owner',
        membersIds: [],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'e1',
                    sets: [
                      generateExerciseSet(1, params),
                      generateExerciseSet(2, params),
                      generateExerciseSet(3, params),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    const periodizationType = PeriodizationType.REPLICATE;
    const trainings = [
      generateTraining(),
      generateTraining(),
      generateTraining(),
    ];

    // spy on strategy.periodize
    const strategy = service.getStrategy(periodizationType);
    const periodizeSpy = jest.spyOn(strategy, 'periodize');
    const result = service.periodize(periodizationType, ref, trainings, ['e1']);
    expect(periodizeSpy).toHaveBeenCalled();

    // expect result intensity and volume to be undefined both
    const strategyResults = periodizeSpy.mock.results.map(
      (r) => r.value as PeriodizationResult,
    );

    for (const res of strategyResults) {
      expect(res.intensity).toBeUndefined();
      expect(res.volume).toBeUndefined();
    }

    periodizeSpy.mockClear();

    for (const training of result) {
      const exercise = training.components[0].supersets[0].exercises.find(
        (e) => e.id === 'e1',
      );

      expect(exercise).toBeDefined();
      for (const set of exercise.sets) {
        expect(set.paramValuesL).toHaveLength(2); // only IntWork2 and VolWork2
        expect(set.paramValuesR).toHaveLength(2);
        expect(set.paramValuesL[0].field).toBe(ParamType.IntWork2);
        expect(set.paramValuesL[1].field).toBe(ParamType.VolWork2);
        expect(set.paramValuesR[0].field).toBe(ParamType.IntWork2);
        expect(set.paramValuesR[1].field).toBe(ParamType.VolWork2);
      }
    }
  });

  it.each([
    ['no-int', ParamType.VolWork1],
    ['no-vol', ParamType.IntWork1],
  ])(
    'should periodize exercise %s param and periodize param %s',
    (exerciseId, paramType) => {
      const periodizationType = PeriodizationType.LINEAR;
      const strategy = service.getStrategy(periodizationType);

      const periodizeSpy = jest.spyOn(strategy, 'periodize');
      const result = service.periodize(
        periodizationType,
        ref,
        TestPeriodizationUtil.TRAININGS,
        [exerciseId],
      );

      expect(periodizeSpy).toHaveBeenCalled();

      // expect result intensity to be defined, volume to be undefined
      const strategyResults = periodizeSpy.mock.results.map(
        (r) => r.value as PeriodizationResult,
      );

      for (const res of strategyResults)
        if (paramType === ParamType.IntWork1) {
          expect(res.intensity).toBeDefined();
          expect(res.volume).toBeUndefined();
        } else {
          expect(res.intensity).toBeUndefined();
          expect(res.volume).toBeDefined();
        }

      periodizeSpy.mockClear();

      for (const training of result) {
        const exercise = training.components[0].supersets[0].exercises.find(
          (e) => e.id === exerciseId,
        );

        expect(exercise).toBeDefined();
        for (const set of exercise.sets) {
          expect(set.paramValuesL).toHaveLength(1);
          expect(set.paramValuesR).toHaveLength(1);
          expect(set.paramValuesL[0].field).toBe(paramType);
          expect(set.paramValuesR[0].field).toBe(paramType);
        }
      }
    },
  );

  it('should periodize L and R params separately', () => {
    const periodizationType = PeriodizationType.LINEAR;
    const result = service.periodize(
      periodizationType,
      ref,
      TestPeriodizationUtil.TRAININGS,
      ['lr'],
    );

    // test that base training is unchanged
    const baseTraining = result[0];
    const expectedBaseValuesL = [
      { int: 30, vol: 20 },
      { int: 31, vol: 21 },
      { int: 32, vol: 22 },
    ];

    const expectedBaseValuesR = [
      { int: 34, vol: 22 },
      { int: 35, vol: 23 },
      { int: 36, vol: 24 },
    ];

    for (let setIndex = 0; setIndex < 3; setIndex++)
      TestPeriodizationUtil.expectExerciseSetValueToBe(
        baseTraining,
        { ...ref, exerciseId: 'lr', supersetIndex: 0, setIndex },
        ({ intL, intR, volL, volR }) => {
          expect(intL).toBe(expectedBaseValuesL[setIndex].int);
          expect(volL).toBe(expectedBaseValuesL[setIndex].vol);
          expect(intR).toBe(expectedBaseValuesR[setIndex].int);
          expect(volR).toBe(expectedBaseValuesR[setIndex].vol);
        },
      );

    // test that other trainings are modified and do not have the same values
    for (let i = 1; i < result.length; i++) {
      const training = result[i];
      expect(training.id).toBe(TestPeriodizationUtil.TRAININGS[i].id);

      for (let setIndex = 0; setIndex < 3; setIndex++)
        TestPeriodizationUtil.expectExerciseSetValueToBe(
          training,
          { ...ref, exerciseId: 'lr', supersetIndex: 0, setIndex },
          ({ intL, intR, volL, volR }) => {
            expect(intL).not.toEqual(intR);
            expect(volL).not.toEqual(volR);

            // the following checks are specific for linear periodization, it is just to ensure that L and R values are different
            expect(intL).toBeGreaterThan(30);
            expect(intR).toBeGreaterThan(34);
            expect(volL).toBeLessThanOrEqual(22);
            expect(volR).toBeLessThanOrEqual(24);
          },
        );
    }
  });

  describe('Subgroup periodization', () => {
    /**
     * Returns a training with a subgroup containing two exercises, where
     * 'e1' is also in main group, 'e2' is only in subgroup, and in main group
     * is also 'e3' which is not in subgroup.
     */
    function generateTrainingWithSubgroup(
      subgroupId: string,
      childrenIds: string[] = [],
    ) {
      return generateTrainingStub({
        ownerId: 'owner',
        membersIds: [],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'e1',
                    sets: [
                      // default values for L and R params
                      generateExerciseSet(
                        1,
                        generateComponentParamsStub([ParamType.IntRec1]),
                      ),
                      generateExerciseSet(
                        2,
                        generateComponentParamsStub([ParamType.IntRec1]),
                      ),
                      generateExerciseSet(
                        3,
                        generateComponentParamsStub([ParamType.IntRec1]),
                      ),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'e3',
                    sets: [
                      generateExerciseSet(
                        1,
                        generateComponentParamsStub([ParamType.IntRec1]),
                      ),
                      generateExerciseSet(
                        2,
                        generateComponentParamsStub([ParamType.IntRec1]),
                      ),
                      generateExerciseSet(
                        3,
                        generateComponentParamsStub([ParamType.IntRec1]),
                      ),
                    ],
                  }),
                ],
              }),
            ],
            subgroups: [
              generateSubgroup({
                id: subgroupId,
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({
                        id: 'e1',
                        sets: [
                          // random values for L and R params
                          generateExerciseSet(1, true),
                          generateExerciseSet(2, true),
                          generateExerciseSet(3, true),
                        ],
                      }),
                      generateTrainingExercise({
                        id: 'e2',
                        sets: [
                          generateExerciseSet(1, true),
                          generateExerciseSet(2, true),
                          generateExerciseSet(3, true),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              ...childrenIds.map((id) =>
                generateSubgroup({
                  id,
                  parentId: subgroupId,
                  supersets: [
                    generateSuperset({
                      exercises: [
                        generateTrainingExercise({
                          id: 'e1',
                          sets: [
                            // random values for L and R params
                            generateExerciseSet(1, true),
                            generateExerciseSet(2, true),
                            generateExerciseSet(3, true),
                          ],
                        }),
                        generateTrainingExercise({
                          id: 'e2',
                          sets: [
                            generateExerciseSet(1, true),
                            generateExerciseSet(2, true),
                            generateExerciseSet(3, true),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ),
            ],
          }),
        ],
      });
    }

    const trainings = [
      generateTrainingWithSubgroup('sg1'),
      generateTrainingWithSubgroup('sg2'),
      generateTrainingWithSubgroup('sg1'),
      generateTrainingWithSubgroup('sg3'),
      generateTrainingWithSubgroup('sg1'),
    ];

    it('should not periodize if exercise is not in subgroup', () => {
      const periodizationType = PeriodizationType.LINEAR;

      // spy on getExercises
      const getExercisesSpy = jest.spyOn(service, 'getExercises');
      const result = service.periodize(
        periodizationType,
        { ...ref, subgroupId: 'sg1' },
        trainings,
        ['e3'], // exercise not in subgroup sg1
      );

      const spyResult = getExercisesSpy.mock.results.map(
        (r) => r.value as TrainingExercise[],
      );

      // e3 should not be found since it is not in subgroup
      expect(spyResult).not.toEqual(
        expect.arrayContaining([
          expect.arrayContaining([expect.objectContaining({ id: 'e3' })]),
        ]),
      );

      getExercisesSpy.mockClear();

      expect(result).toEqual(trainings); // should return same trainings
    });

    it('should periodize subgroup exercise, not main group exercise', () => {
      const periodizationType = PeriodizationType.LINEAR;
      const result = service.periodize(
        periodizationType,
        { ...ref, subgroupId: 'sg1' },
        trainings,
        ['e1'], // exercise in subgroup and main group
      );

      expect(result.length).toBe(trainings.length);

      const indexesWithSubgroup1 = [0, 2, 4]; // trainings with subgroup sg1
      for (let i = 0; i < result.length; i++) {
        const training = result[i];

        const isTrainingWithSubgroup1 = indexesWithSubgroup1.includes(i);
        if (isTrainingWithSubgroup1) {
          // should have periodized subgroup exercise
          const subgroup = training.components[0].subgroups.find(
            (sg) => sg.id === 'sg1',
          );
          expect(subgroup).toBeDefined();

          const exercises = service.getExercises(subgroup);
          const exercise = exercises.find((e) => e.id === 'e1');

          expect(exercise).toBeDefined();
          expect(exercise.sets).toHaveLength(3);

          for (const set of exercise.sets) {
            // subgroup e1 has all params
            expect(set.paramValuesL).toHaveLength(6);
            expect(set.paramValuesR).toHaveLength(6);
          }
        } else {
          // should not have periodized exercises (should be the same as in original training)
          expect(training).toEqual(trainings[i]);

          const subgroup = training.components[0].subgroups.find(
            (sg) => sg.id === 'sg1',
          );

          expect(subgroup).toBeUndefined();

          const exercises = service.getExercises(training.components[0]);
          const exercise = exercises.find((e) => e.id === 'e1');

          expect(exercise).toBeDefined();
          expect(exercise.sets).toHaveLength(3);

          for (const set of exercise.sets) {
            // main group e1 has default values for L and R params
            expect(set.paramValuesL).toHaveLength(1);
            expect(set.paramValuesR).toHaveLength(1);
            expect(set.paramValuesL[0].field).toBe(ParamType.IntRec1);
            expect(set.paramValuesR[0].field).toBe(ParamType.IntRec1);
          }
        }
      }
    });

    it('should periodize root subgroup and its children', () => {
      const trainings = [
        generateTrainingWithSubgroup('sgRoot', ['child-1', 'child-2']),
        generateTrainingWithSubgroup('sgRoot', ['child-1']),
        generateTrainingWithSubgroup('sgRoot', ['child-1', 'child-2']),
      ];

      const periodizationType = PeriodizationType.LINEAR;
      const result = service.periodize(
        periodizationType,
        { ...ref, subgroupId: 'sgRoot' },
        trainings,
        ['e1'], // exercises in root subgroup and its children
      );

      // check that all trainings are periodized
      const baseRootSubgroup = result[0].components[0].subgroups.find(
        (sg) => sg.id === 'sgRoot',
      );

      const baseChildSubgroup1 = result[0].components[0].subgroups.find(
        (sg) => sg.id === 'child-1',
      );

      const baseChildSubgroup2 = result[0].components[0].subgroups.find(
        (sg) => sg.id === 'child-2',
      );

      expect(result.length).toBe(trainings.length);
      expect(baseRootSubgroup).toBeDefined();
      expect(baseChildSubgroup1).toBeDefined();
      expect(baseChildSubgroup2).toBeDefined();

      for (let i = 1; i < result.length; i++) {
        const training = result[i];
        expect(training).not.toEqual(trainings[i]);

        const rootSubgroup = training.components[0].subgroups.find(
          (sg) => sg.id === 'sgRoot',
        );

        const childSubgroup1 = training.components[0].subgroups.find(
          (sg) => sg.id === 'child-1',
        );

        const childSubgroup2 = training.components[0].subgroups.find(
          (sg) => sg.id === 'child-2',
        );

        expect(rootSubgroup).toBeDefined();
        expect(rootSubgroup).not.toEqual(baseRootSubgroup);

        expect(childSubgroup1).toBeDefined();
        expect(childSubgroup1).not.toEqual(baseChildSubgroup1);

        if (i !== 1) {
          // only the second training does not have child-2
          expect(childSubgroup2).toBeDefined();
          expect(childSubgroup2).not.toEqual(baseChildSubgroup2);
        }
      }
    });
  });
});
