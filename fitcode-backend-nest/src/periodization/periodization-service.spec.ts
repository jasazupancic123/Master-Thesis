import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TestPeriodizationUtil } from '@test/common/utils/periodization.util';

import { CommonModule } from '@src/common/common.module';
import type { TrainingComponentRef } from '@src/common/type/firestore.type';
import { validationSchema } from '@src/config/environment-validation-schema';
import { ExerciseParam } from '@src/training/constant/exercise-param.constant';
import { MAIN_GROUP_PARENT_ID } from '@src/training/constant/main-group-parent-id.constant';
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
                      generateExerciseSet(1, [], { isUnilateral: true }),
                      generateExerciseSet(2, [], { isUnilateral: true }),
                      generateExerciseSet(3, [], { isUnilateral: true }),
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
      // expect(res.volume).toBeDefined(); // reps for primary side are always defined, but not for secondary, so its alternating here between defined and undefined, so skip it
    }

    periodizeSpy.mockClear();

    for (const training of result) {
      const exercise = training.components[0].supersets[0].exercises.find(
        (e) => e.id === 'e1',
      );

      expect(exercise).toBeDefined();
      for (const set of exercise.sets) {
        expect(set.reps).toEqual(ExerciseParam.REPS.defaultValue); // default value
        expect(set.loadKg).toBeUndefined();
        expect(set.loadKgR).toBeUndefined();
        expect(set.loadBw).toBeUndefined();
        expect(set.loadBwR).toBeUndefined();
        expect(set.loadRm).toBeUndefined();
        expect(set.loadRmR).toBeUndefined();
      }
    }
  });

  it('should not periodize params that are not present', () => {
    const exerciseId = 'no-int';
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

    for (const res of strategyResults) {
      expect(res.intensity).toBeUndefined();
    }

    periodizeSpy.mockClear();

    for (const training of result) {
      const exercise = training.components[0].supersets[0].exercises.find(
        (e) => e.id === exerciseId,
      );

      expect(exercise).toBeDefined();
      for (const set of exercise.sets) {
        expect(set.reps).toEqual(ExerciseParam.REPS.defaultValue); // default value
        expect(set.loadKg).toBeUndefined();
        expect(set.loadKgR).toBeUndefined();
        expect(set.loadBw).toBeUndefined();
        expect(set.loadBwR).toBeUndefined();
        expect(set.loadRm).toBeUndefined();
        expect(set.loadRmR).toBeUndefined();
      }
    }
  });

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
                      generateExerciseSet(1, ['recDist'], {
                        isUnilateral: true,
                      }),
                      generateExerciseSet(2, ['recDist'], {
                        isUnilateral: true,
                      }),
                      generateExerciseSet(3, ['recDist'], {
                        isUnilateral: true,
                      }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'e3',
                    sets: [
                      generateExerciseSet(1, ['recDist'], {
                        isUnilateral: true,
                      }),
                      generateExerciseSet(2, ['recDist'], {
                        isUnilateral: true,
                      }),
                      generateExerciseSet(3, ['recDist'], {
                        isUnilateral: true,
                      }),
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
                          generateExerciseSet(1, null, {
                            random: true,
                            isUnilateral: true,
                          }),
                          generateExerciseSet(2, null, {
                            random: true,
                            isUnilateral: true,
                          }),
                          generateExerciseSet(3, null, {
                            random: true,
                            isUnilateral: true,
                          }),
                        ],
                      }),
                      generateTrainingExercise({
                        id: 'e2',
                        sets: [
                          generateExerciseSet(1, null, {
                            random: true,
                            isUnilateral: true,
                          }),
                          generateExerciseSet(2, null, {
                            random: true,
                            isUnilateral: true,
                          }),
                          generateExerciseSet(3, null, {
                            random: true,
                            isUnilateral: true,
                          }),
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
                            generateExerciseSet(1, null, { random: true }),
                            generateExerciseSet(2, null, { random: true }),
                            generateExerciseSet(3, null, { random: true }),
                          ],
                        }),
                        generateTrainingExercise({
                          id: 'e2',
                          sets: [
                            generateExerciseSet(1, null, { random: true }),
                            generateExerciseSet(2, null, { random: true }),
                            generateExerciseSet(3, null, { random: true }),
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
            for (const param of ExerciseParam.fields)
              expect(set[param]).toBeDefined();
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
            for (const param of ExerciseParam.fields) {
              if (param === 'reps') expect(set[param]).toBeDefined();
              if (param === 'recDist') expect(set[param]).toBeDefined();
            }
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

  describe('Direct subgroup periodization', () => {
    it('should periodize main group and all its direct children with special id', () => {
      const directSubgroup = generateSubgroup({
        id: 's1',
        parentId: MAIN_GROUP_PARENT_ID, // direct child of main group
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({
                id: 'e1',
                sets: [
                  // random values for L and R params
                  generateExerciseSet(1, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                  generateExerciseSet(2, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const otherSubgroup = generateSubgroup({
        id: 'some-other-subgroup',
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({
                id: 'e1',
                sets: [
                  // random values for L and R params
                  generateExerciseSet(1, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                  generateExerciseSet(2, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                  generateExerciseSet(3, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      function generateTraining() {
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
                        generateExerciseSet(1, ['loadKg'], {
                          isUnilateral: true,
                        }),
                        generateExerciseSet(2, ['loadKg'], {
                          isUnilateral: true,
                        }),
                        generateExerciseSet(3, ['loadKg'], {
                          isUnilateral: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
              subgroups: [directSubgroup, otherSubgroup],
            }),
          ],
        });
      }

      const trainings = [
        generateTraining(),
        generateTraining(),
        generateTraining(),
      ];

      const periodizationType = PeriodizationType.LINEAR;
      const result = service.periodize(periodizationType, ref, trainings, [
        'e1',
      ]);

      // it should periodize main group & subgroup s1 but not "some-other-subgroup"
      expect(result.length).toBe(trainings.length);
      const baseMainComponent = result[0].components[0];

      for (let i = 1; i < result.length; i++) {
        const training = result[i];
        expect(training).not.toEqual(trainings[i]);

        const mainComponent = training.components[0];
        expect(mainComponent).toBeDefined();
        expect(mainComponent).not.toEqual(baseMainComponent);

        const subgroup2 = mainComponent.subgroups.find(
          (sg) => sg.id === 'some-other-subgroup',
        );
        expect(subgroup2).toBeDefined();
        expect(subgroup2).toEqual(otherSubgroup); // should not be periodized
        expect(subgroup2.supersets[0].exercises[0].sets).toHaveLength(3); // should have same number of sets

        const subgroup1 = mainComponent.subgroups.find((sg) => sg.id === 's1');
        expect(subgroup1).toBeDefined();
        expect(subgroup1).not.toEqual(directSubgroup);
        expect(subgroup1?.supersets[0].exercises[0].sets).toHaveLength(2); // should have same number of sets

        // expect values to be different than in base training
        for (let setIndex = 0; setIndex < 2; setIndex++)
          TestPeriodizationUtil.expectExerciseSetValueToBe(
            training,
            {
              exerciseId: 'e1',
              componentId: 'c1',
              supersetIndex: 0,
              setIndex,
              subgroupId: 's1',
            },
            ({ intL, intR }) => {
              const directSubgroupIntL =
                +directSubgroup.supersets[0].exercises[0].sets[setIndex].loadKg;
              const directSubgroupIntR =
                +directSubgroup.supersets[0].exercises[0].sets[setIndex]
                  .loadKgR;

              expect(intL).toBeGreaterThan(directSubgroupIntL);
              expect(intR).toBeGreaterThan(directSubgroupIntR);
            },
          );
      }
    });

    it('should periodize only selected direct subgroup', () => {
      const directSubgroup1 = generateSubgroup({
        id: 's1',
        parentId: MAIN_GROUP_PARENT_ID, // direct child of main group
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({
                id: 'e1',
                sets: [
                  // random values for L and R params
                  generateExerciseSet(1, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                  generateExerciseSet(2, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const directSubgroup2 = generateSubgroup({
        id: 's2',
        parentId: MAIN_GROUP_PARENT_ID, // direct child of main group
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({
                id: 'e1',
                sets: [
                  // random values for L and R params
                  generateExerciseSet(1, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                  generateExerciseSet(2, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                  generateExerciseSet(3, null, {
                    random: true,
                    isUnilateral: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      function generateTraining() {
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
                        generateExerciseSet(1, null, { isUnilateral: true }),
                        generateExerciseSet(2, null, { isUnilateral: true }),
                        generateExerciseSet(3, null, { isUnilateral: true }),
                      ],
                    }),
                  ],
                }),
              ],
              subgroups: [directSubgroup1, directSubgroup2],
            }),
          ],
        });
      }

      const trainings = [
        generateTraining(),
        generateTraining(),
        generateTraining(),
      ];

      const periodizationType = PeriodizationType.LINEAR;
      const result = service.periodize(
        periodizationType,
        { ...ref, subgroupId: 's2' },
        trainings,
        ['e1'],
      );

      // it should periodize only subgroup s2 but not s1
      expect(result.length).toBe(trainings.length);

      const baseMainComponent = result[0].components[0];
      expect(baseMainComponent.subgroups).toHaveLength(2);
      expect(baseMainComponent.subgroups[0].id).toBe('s1');
      expect(baseMainComponent.subgroups[1].id).toBe('s2');

      for (let i = 1; i < result.length; i++) {
        const training = result[i];
        expect(training).not.toEqual(trainings[i]);

        const mainComponent = training.components[0];
        expect(mainComponent).toBeDefined();
        expect(mainComponent.subgroups).toHaveLength(2);
        expect(mainComponent.subgroups[0].id).toBe('s1');
        expect(mainComponent.subgroups[1].id).toBe('s2');

        const subgroup1 = mainComponent.subgroups.find((sg) => sg.id === 's1');
        expect(subgroup1).toBeDefined();
        expect(subgroup1).toEqual(directSubgroup1); // should not be periodized
        expect(subgroup1?.supersets[0].exercises[0].sets).toHaveLength(2); // should have same number of sets

        const subgroup2 = mainComponent.subgroups.find((sg) => sg.id === 's2');
        expect(subgroup2).toBeDefined();
        expect(subgroup2).not.toEqual(directSubgroup2);
        expect(subgroup2?.supersets[0].exercises[0].sets).toHaveLength(3); // should have same number of sets

        // expect values to be different than in base training
        for (let setIndex = 0; setIndex < 3; setIndex++)
          TestPeriodizationUtil.expectExerciseSetValueToBe(
            training,
            {
              exerciseId: 'e1',
              componentId: 'c1',
              supersetIndex: 0,
              setIndex,
              subgroupId: 's2',
            },
            ({ intL, intR }) => {
              const directSubgroupIntL =
                +directSubgroup2.supersets[0].exercises[0].sets[setIndex]
                  .loadKg;
              const directSubgroupIntR =
                +directSubgroup2.supersets[0].exercises[0].sets[setIndex]
                  .loadKgR;

              expect(intL).toBeGreaterThan(directSubgroupIntL);
              expect(intR).toBeGreaterThan(directSubgroupIntR);
            },
          );
      }
    });
  });
});
