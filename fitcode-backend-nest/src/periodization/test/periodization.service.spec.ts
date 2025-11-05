import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TestPeriodizationUtil } from '@test/common/utils/periodization.util';
import { addDays, nextWednesday } from 'date-fns';

import { AttributeModule } from '@src/attribute/attribute.module';
import { CommonModule } from '@src/common/common.module';
import type { TrainingComponentRef } from '@src/common/type/firestore.type';
import { validationSchema } from '@src/config/environment-validation-schema';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
import { MAIN_GROUP_PARENT_ID } from '@src/training/constant/main-group-parent-id.constant';
import type { Training } from '@src/training/entity/training.entity';
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

import { PeriodizationService } from '../periodization.service';
import type { PeriodizationResult } from '../strategy/periodization.strategy';
import { testBaseTrainingComplexPeriodization } from './periodization-util';

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
        AttributeModule,
      ],
      providers: [ExerciseParamService, PeriodizationService],
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
                      generateExerciseSet(1, { reps: 10 }),
                      generateExerciseSet(2, { reps: 10 }),
                      generateExerciseSet(3, { reps: 10 }),
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
        expect(set.reps).toEqual(10); // default value
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

    for (const res of strategyResults) expect(res.intensity).toBeUndefined();
    periodizeSpy.mockClear();

    for (const training of result) {
      const exercise = training.components[0].supersets[0].exercises.find(
        (e) => e.id === exerciseId,
      );

      expect(exercise).toBeDefined();
      for (const set of exercise.sets) {
        expect(set.reps).toBeLessThanOrEqual(10);
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
                      generateExerciseSet(1, { reps: 10, recDist: 50 }),
                      generateExerciseSet(2, { reps: 10, recDist: 50 }),
                      generateExerciseSet(3, { reps: 10, recDist: 50 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'e3',
                    sets: [
                      generateExerciseSet(1, { reps: 10, recDist: 50 }),
                      generateExerciseSet(2, { reps: 10, recDist: 50 }),
                      generateExerciseSet(3, { reps: 10, recDist: 50 }),
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
                          generateExerciseSet(1, {
                            reps: 10,
                            repsR: 9,
                            loadKg: 24,
                            loadKgR: 27,
                          }),
                          generateExerciseSet(2, {
                            reps: 10,
                            repsR: 9,
                            loadKg: 24,
                            loadKgR: 27,
                          }),
                          generateExerciseSet(3, {
                            reps: 10,
                            repsR: 9,
                            loadKg: 24,
                            loadKgR: 27,
                          }),
                        ],
                      }),
                      generateTrainingExercise({
                        id: 'e2',
                        sets: [
                          generateExerciseSet(1, {
                            reps: 10,
                            repsR: 9,
                            loadKg: 24,
                            loadKgR: 27,
                          }),
                          generateExerciseSet(2, {
                            reps: 10,
                            repsR: 9,
                            loadKg: 24,
                            loadKgR: 27,
                          }),
                          generateExerciseSet(3, {
                            reps: 10,
                            repsR: 9,
                            loadKg: 24,
                            loadKgR: 27,
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
                            generateExerciseSet(1, {
                              reps: 10,
                              repsR: 9,
                              loadKg: 24,
                              loadKgR: 27,
                            }),
                            generateExerciseSet(2, {
                              reps: 10,
                              repsR: 9,
                              loadKg: 24,
                              loadKgR: 27,
                            }),
                            generateExerciseSet(3, {
                              reps: 10,
                              repsR: 9,
                              loadKg: 24,
                              loadKgR: 27,
                            }),
                          ],
                        }),
                        generateTrainingExercise({
                          id: 'e2',
                          sets: [
                            generateExerciseSet(1, {
                              reps: 10,
                              repsR: 9,
                              loadKg: 24,
                              loadKgR: 27,
                            }),
                            generateExerciseSet(2, {
                              reps: 10,
                              repsR: 9,
                              loadKg: 24,
                              loadKgR: 27,
                            }),
                            generateExerciseSet(3, {
                              reps: 10,
                              repsR: 9,
                              loadKg: 24,
                              loadKgR: 27,
                            }),
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
            expect(set.reps).toBeDefined();
            expect(set.repsR).toBeDefined();
            expect(set.loadKg).toBeDefined();
            expect(set.loadKgR).toBeDefined();
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
            expect(set.reps).toBeDefined();
            expect(set.recDist).toBeDefined();

            // all else undefined
            expect(set.repsR).toBeUndefined();
            expect(set.loadKg).toBeUndefined();
            expect(set.loadKgR).toBeUndefined();
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
      const virtual = generateSubgroup({
        id: 's1',
        parentId: MAIN_GROUP_PARENT_ID, // direct child of main group
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({
                id: 'e1',
                sets: [
                  // random values for L and R params
                  generateExerciseSet(1, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
                  }),
                  generateExerciseSet(2, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const regular = generateSubgroup({
        id: 'some-other-subgroup',
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({
                id: 'e1',
                sets: [
                  // random values for L and R params
                  generateExerciseSet(1, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
                  }),
                  generateExerciseSet(2, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
                  }),
                  generateExerciseSet(3, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
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
                        generateExerciseSet(1, { reps: 10, loadKg: 60 }),
                        generateExerciseSet(2, { reps: 11, loadKg: 55 }),
                        generateExerciseSet(3, { reps: 12, loadKg: 50 }),
                      ],
                    }),
                  ],
                }),
              ],
              subgroups: [virtual, regular],
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
        expect(subgroup2).toEqual(regular); // should not be periodized
        expect(subgroup2.supersets[0].exercises[0].sets).toHaveLength(3); // should have same number of sets

        const subgroup1 = mainComponent.subgroups.find((sg) => sg.id === 's1');
        expect(subgroup1).toBeDefined();
        expect(subgroup1).not.toEqual(virtual);
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
                +virtual.supersets[0].exercises[0].sets[setIndex].loadKg;
              const directSubgroupIntR =
                +virtual.supersets[0].exercises[0].sets[setIndex].loadKgR;

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
                  generateExerciseSet(1, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
                  }),
                  generateExerciseSet(2, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
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
                  generateExerciseSet(1, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
                  }),
                  generateExerciseSet(2, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
                  }),
                  generateExerciseSet(3, {
                    reps: 10,
                    repsR: 9,
                    loadKg: 24,
                    loadKgR: 27,
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
                        generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                        generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                        generateExerciseSet(3, { reps: 10, loadKg: 50 }),
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

  describe('Periodization of other params, not just reps and kilograms', () => {
    // main group with 2 virtual subgroups and 1 subgroup with 1 virtual subgroup
    it('should periodize exercise with complex periodization', () => {
      const base = structuredClone(testBaseTrainingComplexPeriodization);
      const trainings = [base, structuredClone(base), structuredClone(base)];

      // make each training in future by 1 week
      for (let i = 1; i < trainings.length; i++) {
        trainings[i].from = addDays(trainings[0].from, i * 7);
        trainings[i].to = addDays(trainings[0].to, i * 7);
      }

      const result = service.periodize(
        PeriodizationType.LINEAR,
        { trainingId: base.id, componentId: 'c1' },
        trainings,
        ['yoyo'],
      );

      expect(result.length).toBe(trainings.length);
      expect(result[0]).toEqual(trainings[0]);

      for (let i = 1; i < result.length; i++) {
        const training = result[i];
        expect(training).not.toEqual(trainings[i]);

        // check main group exercise
        const main = training.components[0];
        expect(main.supersets[0].exercises[0].id).toBe('yoyo');
        expect(main.supersets[0].exercises[0].sets).toHaveLength(3);

        for (let setIndex = 0; setIndex < 3; setIndex++) {
          const resultSet = main.supersets[0].exercises[0].sets[setIndex];
          const baseSet =
            base.components[0].supersets[0].exercises[0].sets[setIndex];

          expect(resultSet.time).toBeLessThan(baseSet.time);
          expect(resultSet.dist).toBeUndefined();
          expect(resultSet.reps).toBeUndefined();
          expect(resultSet.repsR).toBeUndefined();
          expect(resultSet.loadKg).toBeUndefined();
          expect(resultSet.loadKgR).toBeUndefined();
          expect(resultSet.loadBw).toBeUndefined();
          expect(resultSet.loadBwR).toBeUndefined();
        }

        // check first virtual subgroup exercise
        const vsg1 = main.subgroups.find((sg) => sg.id === 'main-sg-1');
        expect(vsg1.supersets[0].exercises[0].id).toBe('yoyo');
        expect(vsg1.supersets[0].exercises[0].sets).toHaveLength(2);

        for (let setIndex = 0; setIndex < 2; setIndex++) {
          const resultSet = vsg1!.supersets[0].exercises[0].sets[setIndex];
          const baseSet =
            base.components[0].subgroups[0].supersets[0].exercises[0].sets[
              setIndex
            ];

          expect(resultSet.dist).toBeLessThan(baseSet.dist);
          expect(resultSet.time).toBeUndefined();
          expect(resultSet.reps).toBeUndefined();
          expect(resultSet.repsR).toBeUndefined();
          expect(resultSet.loadKg).toBeUndefined();
          expect(resultSet.loadKgR).toBeUndefined();
        }

        // check second virtual subgroup exercise
        const vsg2 = main.subgroups.find((sg) => sg.id === 'main-sg-2');
        expect(vsg2).toBeDefined();
        expect(vsg2?.supersets[0].exercises[0].id).toBe('yoyo');
        expect(vsg2?.supersets[0].exercises[0].sets).toHaveLength(4);

        for (let setIndex = 0; setIndex < 4; setIndex++) {
          const resultSet = vsg2!.supersets[0].exercises[0].sets[setIndex];
          const baseSet =
            base.components[0].subgroups[1].supersets[0].exercises[0].sets[
              setIndex
            ];

          expect(resultSet.time).toBeLessThan(baseSet.time);
          expect(resultSet.dist).toBeUndefined();
          expect(resultSet.reps).toBeUndefined();
          expect(resultSet.repsR).toBeUndefined();
          expect(resultSet.loadKg).toBeUndefined();
          expect(resultSet.loadKgR).toBeUndefined();
        }

        // other 2 subgroups should remain unchanged
        const sg = main.subgroups.find((sg) => sg.id === 'root-sg');
        expect(sg).toBeDefined();
        expect(sg).toEqual(
          trainings[i].components[0].subgroups.find(
            (sg) => sg.id === 'root-sg',
          ),
        );

        const sgChild = main.subgroups.find((sg) => sg.id === 'child-sg-1');
        expect(sgChild).toBeDefined();
        expect(sgChild).toEqual(
          trainings[i].components[0].subgroups.find(
            (sg) => sg.id === 'child-sg-1',
          ),
        );
      }
    });
  });

  describe('Warmup / cooldown sets', () => {
    const baseDay = nextWednesday(new Date());

    const warmup = generateSuperset({
      warmup: true,
      exercises: [
        generateTrainingExercise({
          id: 'e-wu-cd',
          sets: [
            generateExerciseSet(1, { reps: 15, loadKg: 40 }),
            generateExerciseSet(2, { reps: 15, loadKg: 40 }),
            generateExerciseSet(3, { reps: 15, loadKg: 40 }),
          ],
        }),
      ],
    });

    const cooldown = generateSuperset({
      cooldown: true,
      exercises: [
        generateTrainingExercise({
          id: 'e-wu-cd',
          sets: [
            generateExerciseSet(1, { reps: 15, loadKg: 10 }),
            generateExerciseSet(2, { reps: 15, loadKg: 10 }),
            generateExerciseSet(3, { reps: 15, loadKg: 10 }),
          ],
        }),
      ],
    });

    // 3 trainings, each 1 week apart
    const TRAININGS: Training[] = [
      generateTrainingStub({
        ownerId: 'owner',
        membersIds: [],
        date: baseDay,
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              warmup,
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'e-wu-cd',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 20 }),
                      generateExerciseSet(2, { reps: 8, loadKg: 40 }),
                      generateExerciseSet(3, { reps: 6, loadKg: 60 }),
                      generateExerciseSet(4, { reps: 12, loadKg: 15 }),
                    ],
                  }),
                ],
              }),
              cooldown,
            ],
          }),
        ],
      }),
      generateTrainingStub({
        ownerId: 'owner',
        membersIds: [],
        date: addDays(baseDay, 7),
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              warmup,
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'e-wu-cd',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 20 }),
                      generateExerciseSet(2, { reps: 8, loadKg: 40 }),
                      generateExerciseSet(3, { reps: 6, loadKg: 60 }),
                      generateExerciseSet(4, { reps: 12, loadKg: 15 }),
                    ],
                  }),
                ],
              }),
              cooldown,
            ],
          }),
        ],
      }),
      generateTrainingStub({
        ownerId: 'owner',
        membersIds: [],
        date: addDays(baseDay, 14),
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              warmup,
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'e-wu-cd',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 20 }),
                      generateExerciseSet(2, { reps: 8, loadKg: 40 }),
                      generateExerciseSet(3, { reps: 6, loadKg: 60 }),
                      generateExerciseSet(4, { reps: 12, loadKg: 15 }),
                    ],
                  }),
                ],
              }),
              cooldown,
            ],
          }),
        ],
      }),
    ];

    it('should not periodize warmup and cooldown sets by default', () => {
      const periodizationType = PeriodizationType.LINEAR;
      const strategy = service.getStrategy(periodizationType);

      const periodizeSpy = jest.spyOn(strategy, 'periodize');
      const result = service.periodize(periodizationType, ref, TRAININGS, [
        'e-wu-cd',
      ]);

      expect(periodizeSpy).toHaveBeenCalled();
      periodizeSpy.mockClear();

      const training = result[0];
      const supersets = training.components[0].supersets;

      const warmupSets = supersets[0].exercises[0].sets;
      const mainSets = supersets[1].exercises[0].sets;
      const cooldownSets = supersets[2].exercises[0].sets;

      for (const set of warmupSets) {
        expect(set.reps).toBe(15);
        expect(set.loadKg).toBe(40);
      }

      for (let i = 0; i < mainSets.length; i++) {
        const set = mainSets[i];
        // intensity and volume should be defined for main sets
        expect(set.reps).toBeDefined();
        expect(set.loadKg).toBeDefined();

        // should be same as in original training since only one training
        const originalSet =
          TRAININGS[0].components[0].supersets[1].exercises[0].sets[i];
        expect(set.reps).toBe(originalSet.reps);
        expect(set.loadKg).toBe(originalSet.loadKg);
      }

      for (const set of cooldownSets) {
        expect(set.reps).toBe(15);
        expect(set.loadKg).toBe(10);
      }
    });
  });
});
