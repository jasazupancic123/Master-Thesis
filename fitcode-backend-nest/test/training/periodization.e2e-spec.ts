import { TestApp } from '@test/common/utils/app.util';
import { TestPeriodizationUtil } from '@test/common/utils/periodization.util';
import { addDays } from 'date-fns';

import type { Target } from '@src/exercise/entity/target.entity';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateCyclesStub } from '@src/institution/mock/cycle.stub';
import { TestDbService } from '@src/test-db/test-db.service';
import { MAIN_GROUP_PARENT_ID } from '@src/training/constant/main-group-parent-id.constant';
import type { PeriodizeTrainingsDto } from '@src/training/dto/periodize-training.dto';
import type { Training } from '@src/training/entity/training.entity';
import { PeriodizationType } from '@src/training/enum/periodization-type.enum';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' }); // has target
  const c2 = generateComponentStub({ field: 'c2' }); // has no target

  return { Components: [c1, c2] };
});

// mock targets constant also
jest.mock('@src/exercise/constant/target.constant', () => {
  const strength: Target = {
    field: 'strength',
    name: 'Strength',
    componentId: 'c1',
  };

  return { Targets: [strength] };
});

describe('Periodization functions (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institutionId: string;
  let groupId: string;
  let baseTrainingId: string;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    const institution = await db.institutions.createTest();
    institutionId = institution.id;
    groupId = await db.groups.save(
      generateGroupStub({ institutionId, cycles: generateCyclesStub(3) }),
    );

    baseTrainingId = await db.trainings.save(
      TestPeriodizationUtil.generateTraining(0, {
        ownerId: global.trainer.id,
        institutionId,
        groupId,
      }),
    );
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function request(
    trainingId: string,
    componentId: string,
    body: PeriodizeTrainingsDto = {
      exerciseIds: [],
      periodizationType: PeriodizationType.REPLICATE,
    },
  ) {
    return await testApp.http.patch(
      `/training/${trainingId}/periodize/component/${componentId}`,
      global.trainer.token,
      body,
    );
  }

  it('should throw error if base training in the past', async () => {
    const pastTrainingId = await db.trainings.save(
      TestPeriodizationUtil.generateTraining(-10, {
        ownerId: global.trainer.id,
        institutionId,
        groupId,
      }),
    );

    const response = await request(pastTrainingId, 'c1');
    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'You can only periodize upcoming trainings',
    );

    await db.trainings.delete(pastTrainingId);
  });

  it('should fail if component not found', async () => {
    const response = await request(baseTrainingId, 'nonexistent');
    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Training component not found');
  });

  it('should periodize trainings successfully', async () => {
    // create 3 trainings for periodization
    const dataWithC1: Partial<Training> = {
      ownerId: global.trainer.id,
      institutionId,
      groupId,
      components: [
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'different-exercise-1' }),
              ],
            }),
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'different-exercise-2' }),
              ],
            }),
          ],
        }), // should be periodized
      ],
    };

    const dataWithoutC1: Partial<Training> = {
      ownerId: global.trainer.id,
      institutionId,
      groupId,
      components: [
        generateTrainingComponent({ id: 'unknown' }), // should not be periodized
      ],
    };

    const trainings = [
      TestPeriodizationUtil.generateTraining(0, dataWithC1),
      TestPeriodizationUtil.generateTraining(1, dataWithoutC1),
      TestPeriodizationUtil.generateTraining(2, dataWithC1),
    ];

    await Promise.all(trainings.map((t) => db.trainings.save(t)));

    const response = await request(baseTrainingId, 'c1', {
      exerciseIds: ['e1', 'e2'],
      periodizationType: PeriodizationType.REPLICATE,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2); // not 3 since one training has no c1 component
    const result = response.body as Training[];

    // base training has only 1 component with 1 superset of 5 exercises
    const baseTraining = result[0];
    expect(baseTraining.id).toBe(baseTrainingId);
    expect(baseTraining.components).toHaveLength(1);

    const baseComponent = baseTraining.components[0];
    expect(baseComponent.id).toBe('c1');
    expect(baseComponent.supersets).toHaveLength(1);
    expect(baseComponent.supersets[0].exercises).toHaveLength(5);

    for (let i = 1; i < result.length; i++) {
      const training = result[i];
      const componentC1 = training.components.find((c) => c.id === 'c1');
      const componentUnknown = training.components.find(
        (c) => c.id === 'unknown',
      );

      expect(componentC1).toBeDefined();
      expect(componentUnknown).toBeUndefined();

      // component should override supersets in future trainings
      expect(componentC1?.supersets).toHaveLength(1);
      expect(componentC1?.supersets[0].exercises).toHaveLength(5); // 5 from base component
    }

    await db.trainings.clear();
  });

  it('should periodize subgroups successfully', async () => {
    await db.trainings.clear();

    const newBaseTraining = generateTrainingStub({
      ownerId: global.trainer.id,
      membersIds: ['a', 'b', 'c'],
      date: new Date(),
      institutionId,
      groupId,
      components: [
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: 'e1',
                  sets: [generateExerciseSet(1), generateExerciseSet(2)],
                }),
                generateTrainingExercise({
                  id: 'e2',
                  sets: [generateExerciseSet(1)],
                }),
              ],
            }),
          ],
          subgroups: [
            generateSubgroup({
              id: 'sg1',
              membersIds: ['a', 'b'],
              supersets: [
                generateSuperset({
                  exercises: [
                    generateTrainingExercise({
                      id: 'e3',
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
            generateSubgroup({
              id: 'sg1-child-1',
              parentId: 'sg1',
              membersIds: ['a'],
              supersets: [
                generateSuperset({
                  exercises: [
                    generateTrainingExercise({
                      id: 'e3',
                      sets: [
                        generateExerciseSet(1),
                        generateExerciseSet(2),
                        generateExerciseSet(3),
                        generateExerciseSet(4),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const newBaseTrainingId = await db.trainings.save(newBaseTraining);

    // check that sets are correctly saved -> unique length of sets will be our baseline for verifying that
    // periodization works correctly and copies / overrides sets
    const foundBaseTraining = await db.trainings.findById(newBaseTrainingId);
    expect(
      foundBaseTraining.components[0].supersets[0].exercises[0].sets,
    ).toHaveLength(2);
    expect(
      foundBaseTraining.components[0].supersets[0].exercises[1].sets,
    ).toHaveLength(1);
    expect(
      foundBaseTraining.components[0].subgroups[0].supersets[0].exercises[0]
        .sets,
    ).toHaveLength(3);
    expect(
      foundBaseTraining.components[0].subgroups[1].supersets[0].exercises[0]
        .sets,
    ).toHaveLength(4);

    const trainings = [
      // 1st training (no subgroups), subgroup should be created after periodization
      generateTrainingStub({
        ownerId: global.trainer.id,
        membersIds: ['a', 'b', 'c'],
        date: addDays(new Date(), 1),
        institutionId,
        groupId,
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: 'e1' }),
                  generateTrainingExercise({ id: 'e2' }),
                ],
              }),
            ],
          }),
        ],
      }),
      // 2nd training (with 1 same subgroup that should be overridden and 1 new subgroup)
      generateTrainingStub({
        ownerId: global.trainer.id,
        membersIds: ['a', 'b', 'c'],
        date: addDays(new Date(), 2),
        institutionId,
        groupId,
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e3' })],
              }),
            ],
            subgroups: [
              generateSubgroup({
                id: 'sg1',
                name: 'Subgroup 1',
                membersIds: ['a', 'b'],
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'e1' }),
                      generateTrainingExercise({ id: 'e2' }),
                    ],
                  }),
                ],
              }),
              generateSubgroup({
                id: 'sg2',
                name: 'Subgroup 2',
                membersIds: ['c'],
                supersets: [
                  generateSuperset({
                    exercises: [generateTrainingExercise({ id: 'e4' })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // 3rd training (with 1 same subgroup that now has child subgroups)
      generateTrainingStub({
        ownerId: global.trainer.id,
        membersIds: ['a', 'b', 'c'],
        date: addDays(new Date(), 3),
        institutionId,
        groupId,
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e5' })],
              }),
            ],
            subgroups: [
              generateSubgroup({
                id: 'sg1',
                membersIds: ['a', 'b'],
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'e1' }),
                      generateTrainingExercise({ id: 'e2' }),
                    ],
                  }),
                ],
              }),
              generateSubgroup({
                id: 'sg1.1',
                parentId: 'sg1',
                membersIds: ['a'],
                supersets: [
                  generateSuperset({
                    exercises: [generateTrainingExercise({ id: 'e4' })],
                  }),
                ],
              }),
              generateSubgroup({
                id: 'sg1.2',
                parentId: 'sg1',
                membersIds: ['b'],
                supersets: [
                  generateSuperset({
                    exercises: [generateTrainingExercise({ id: 'e5' })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // 4th training (with 1 different subgroup that should be overridden)
      generateTrainingStub({
        ownerId: global.trainer.id,
        membersIds: ['a', 'b', 'c'],
        date: addDays(new Date(), 4),
        institutionId,
        groupId,
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e6' })],
              }),
            ],
            subgroups: [
              generateSubgroup({
                id: 'sg3',
                name: 'Subgroup 3',
                membersIds: ['a', 'b'],
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'e1' }),
                      generateTrainingExercise({ id: 'e2' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // 5th training (with direct subgroup of component that should overriden)
      generateTrainingStub({
        ownerId: global.trainer.id,
        membersIds: ['a', 'b', 'c'],
        date: addDays(new Date(), 5),
        institutionId,
        groupId,
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e6' })],
              }),
            ],
            subgroups: [
              generateSubgroup({
                id: 'ds1',
                parentId: MAIN_GROUP_PARENT_ID,
                name: 'Direct subgroup of component 1',
                membersIds: ['a'],
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'e1' }),
                      generateTrainingExercise({ id: 'e2' }),
                    ],
                  }),
                ],
              }),
              generateSubgroup({
                id: 'ds2',
                parentId: MAIN_GROUP_PARENT_ID,
                name: 'Direct subgroup of component 2',
                membersIds: ['c'],
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'e1' }),
                      generateTrainingExercise({ id: 'e2' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    const ids = await Promise.all(trainings.map((t) => db.trainings.save(t)));

    // check that each exercise has sets of length 0, since only base training has sets which will override them
    const foundTrainings = await db.trainings.findAll((q) =>
      q.where('id', 'in', ids).orderBy('from', 'asc'),
    );

    expect(foundTrainings).toHaveLength(5);
    for (const training of foundTrainings) {
      const componentC1 = training.components.find((c) => c.id === 'c1');
      expect(componentC1).toBeDefined();
      expect(componentC1.supersets).toHaveLength(1);

      const exercises = componentC1.supersets[0].exercises.concat(
        componentC1.subgroups.flatMap((sg) =>
          sg.supersets.flatMap((s) => s.exercises),
        ),
      );

      for (const exercise of exercises) expect(exercise.sets).toHaveLength(0);
    }

    const response = await request(newBaseTrainingId, 'c1', {
      exerciseIds: ['e3'],
      periodizationType: PeriodizationType.REPLICATE,
      subgroupId: 'sg1',
    });

    expect(response.status).toBe(200);
    const result = response.body as Training[];
    expect(result).toHaveLength(6); // all 5 trainings + base training

    const resultBaseTraining = result[0];
    expect(resultBaseTraining.id).toBe(newBaseTrainingId);
    expect(resultBaseTraining.components).toHaveLength(1);

    const resultComponent = resultBaseTraining.components[0];
    expect(resultComponent.id).toBe('c1');
    expect(resultComponent.copiedFrom).toBeFalsy();
    expect(resultComponent.supersets).toHaveLength(1);
    expect(resultComponent.subgroups).toHaveLength(2);
    expect(resultComponent.supersets[0].exercises).toHaveLength(2); // e1, e2
    expect(resultComponent.supersets[0].exercises[0].sets).toHaveLength(2); // e1 sets
    expect(resultComponent.supersets[0].exercises[0].sets).toEqual(
      foundBaseTraining.components[0].supersets[0].exercises[0].sets,
    );
    expect(resultComponent.supersets[0].exercises[1].sets).toHaveLength(1); // e2 sets
    expect(resultComponent.supersets[0].exercises[1].sets).toEqual(
      foundBaseTraining.components[0].supersets[0].exercises[1].sets,
    );

    const resultRootSubgroup = resultComponent.subgroups[0];
    expect(resultRootSubgroup.id).toBe('sg1');
    expect(resultRootSubgroup.parentId).toBeFalsy();
    expect(resultRootSubgroup.membersIds).toHaveLength(2);
    expect(resultRootSubgroup.supersets).toHaveLength(1);
    expect(resultRootSubgroup.supersets[0].exercises).toHaveLength(1); // e3
    expect(resultRootSubgroup.supersets[0].exercises[0].sets).toHaveLength(3); // e3 sets
    expect(resultRootSubgroup.supersets[0].exercises[0].sets).toEqual(
      foundBaseTraining.components[0].subgroups[0].supersets[0].exercises[0]
        .sets,
    );

    const resultChildSubgroup = resultComponent.subgroups[1];
    expect(resultChildSubgroup.id).toBe('sg1-child-1');
    expect(resultChildSubgroup.parentId).toBe('sg1');
    expect(resultChildSubgroup.membersIds).toHaveLength(1);
    expect(resultChildSubgroup.supersets).toHaveLength(1);
    expect(resultChildSubgroup.supersets[0].exercises).toHaveLength(1); // e3
    expect(resultChildSubgroup.supersets[0].exercises[0].sets).toHaveLength(4); // e3 sets
    expect(resultChildSubgroup.supersets[0].exercises[0].sets).toEqual(
      foundBaseTraining.components[0].subgroups[1].supersets[0].exercises[0]
        .sets,
    );

    const NEW_SUBGROUP_COUNT = {
      1: 2, // 1st training new subgroup sg1 and sg1-child-1
      2: 3, // 2nd has old sg2, sg1 which is overridden and new sg1-child-1
      3: 2, // 3rd has sg1 which is overridden (and its children are also deleted) and new sg1-child-1
      4: 2, // 4th has old sg3 (now its deleted because members are the same as in sg1) and new sg1 and sg1-child-1
      5: 3, // 5th subgroup 'ds' is overriden by new subgroup, and 'ds2' remains
    };

    for (let i = 1; i < result.length; i++) {
      const training = result[i];
      expect(training.components).toHaveLength(1);

      const componentC1 = training.components[0];
      expect(componentC1.id).toBe('c1');
      expect(componentC1.supersets).toHaveLength(1);
      expect(componentC1.copiedFrom).toEqual({
        lastCopiedFromTrainingId: newBaseTrainingId,
        rootCopiedFromTrainingId: newBaseTrainingId,
      });

      expect(componentC1.subgroups).toHaveLength(NEW_SUBGROUP_COUNT[i]);

      const rootSubgroup = componentC1.subgroups.find((sg) => sg.id === 'sg1');
      expect(rootSubgroup).toBeDefined();
      expect(rootSubgroup.membersIds).toHaveLength(2);
      expect(rootSubgroup.supersets).toHaveLength(1);
      expect(rootSubgroup.supersets[0].exercises).toHaveLength(1);
      expect(rootSubgroup.supersets[0].exercises[0].sets).toHaveLength(3); // e3 sets

      const childSubgroup = componentC1.subgroups.find(
        (sg) => sg.id === 'sg1-child-1',
      );
      expect(childSubgroup).toBeDefined();
      expect(childSubgroup.membersIds).toHaveLength(1);
      expect(childSubgroup.supersets).toHaveLength(1);
      expect(childSubgroup.supersets[0].exercises).toHaveLength(1);
      expect(childSubgroup.supersets[0].exercises[0].sets).toHaveLength(4); // e3 sets
    }
    await db.trainings.clear();
  });

  it('should periodize direct component subgroup successfully', async () => {
    await db.trainings.clear();

    const baseTraining = generateTrainingStub({
      ownerId: global.trainer.id,
      membersIds: ['a', 'b', 'c'],
      date: new Date(),
      institutionId,
      groupId,
      components: [
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: 'e1',
                  sets: [generateExerciseSet(1), generateExerciseSet(2)],
                }),
                generateTrainingExercise({
                  id: 'e2',
                  sets: [generateExerciseSet(1)],
                }),
              ],
            }),
          ],
          subgroups: [
            generateSubgroup({
              id: 'ds',
              parentId: MAIN_GROUP_PARENT_ID,
              name: 'Direct subgroup of component',
              membersIds: ['a'],
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
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const baseTrainingId = await db.trainings.save(baseTraining);
    const foundBaseTraining = await db.trainings.findById(baseTrainingId);

    function generateTraining(n: number) {
      return generateTrainingStub({
        ownerId: global.trainer.id,
        membersIds: ['a', 'b', 'c'],
        date: addDays(new Date(), n),
        institutionId,
        groupId,
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'e1',
                    sets: [generateExerciseSet(1), generateExerciseSet(2)],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    const trainings = [
      generateTraining(1),
      generateTraining(2),
      generateTraining(3),
      generateTraining(4),
    ];

    const ids = await Promise.all(trainings.map((t) => db.trainings.save(t)));
    expect(ids).toHaveLength(4);

    const response = await request(baseTrainingId, 'c1', {
      exerciseIds: ['e1'],
      periodizationType: PeriodizationType.REPLICATE,
      subgroupId: 'ds',
    });

    expect(response).toBeDefined();
    expect(response.status).toBe(200);

    const result = response.body as Training[];
    expect(result).toHaveLength(5); // all 4 trainings + base training

    const resultBaseTraining = result[0];
    expect(resultBaseTraining.id).toBe(baseTrainingId);
    expect(resultBaseTraining.components).toHaveLength(1);

    const resultComponent = resultBaseTraining.components[0];
    expect(resultComponent.id).toBe('c1');
    expect(resultComponent.copiedFrom).toBeFalsy();
    expect(resultComponent.supersets).toHaveLength(1);
    expect(resultComponent.subgroups).toHaveLength(1);
    expect(resultComponent.supersets[0].exercises).toHaveLength(2); // e1, e2
    expect(resultComponent.supersets[0].exercises[0].sets).toHaveLength(2); // e1 sets
    expect(resultComponent.supersets[0].exercises[0].sets).toEqual(
      foundBaseTraining.components[0].supersets[0].exercises[0].sets,
    );
    expect(resultComponent.supersets[0].exercises[1].sets).toHaveLength(1); // e2 sets
    expect(resultComponent.supersets[0].exercises[1].sets).toEqual(
      foundBaseTraining.components[0].supersets[0].exercises[1].sets,
    );

    const resultDirectSubgroup = resultComponent.subgroups[0];
    expect(resultDirectSubgroup.id).toBe('ds');
    expect(resultDirectSubgroup.parentId).toBe(MAIN_GROUP_PARENT_ID);
    expect(resultDirectSubgroup.membersIds).toHaveLength(1);
    expect(resultDirectSubgroup.supersets).toHaveLength(1);
    expect(resultDirectSubgroup.supersets[0].exercises).toHaveLength(1); // e1
    expect(resultDirectSubgroup.supersets[0].exercises[0].sets).toHaveLength(3); // e1 sets
    expect(resultDirectSubgroup.supersets[0].exercises[0].sets).toEqual(
      foundBaseTraining.components[0].subgroups[0].supersets[0].exercises[0]
        .sets,
    );

    // all new trainings should have copied subgroup
    for (let i = 1; i < result.length; i++) {
      const training = result[i];
      expect(training.components).toHaveLength(1);

      const componentC1 = training.components[0];
      expect(componentC1.id).toBe('c1');
      expect(componentC1.supersets).toHaveLength(1);
      expect(componentC1.copiedFrom).toEqual({
        lastCopiedFromTrainingId: baseTrainingId,
        rootCopiedFromTrainingId: baseTrainingId,
      });

      expect(componentC1.subgroups).toHaveLength(1);
      const directSubgroup = componentC1.subgroups[0];
      expect(directSubgroup.id).toBe('ds');
      expect(directSubgroup.parentId).toBe(MAIN_GROUP_PARENT_ID);
      expect(directSubgroup.membersIds).toHaveLength(1);
      expect(directSubgroup.supersets).toHaveLength(1);
      expect(directSubgroup.supersets[0].exercises).toHaveLength(1); // e1
      expect(directSubgroup.supersets[0].exercises[0].sets).toHaveLength(3); // e1 sets
    }
  });

  describe('Periodization with targets', () => {
    let dataWithTarget: Partial<Training> & {
      date: Date;
      ownerId: string;
      membersIds: string[];
    };

    let dataWithoutTarget: Partial<Training> & {
      date: Date;
      ownerId: string;
      membersIds: string[];
    };

    beforeAll(async () => {
      dataWithTarget = {
        date: addDays(new Date(), 1),
        ownerId: global.trainer.id,
        institutionId,
        groupId,
        cycleId: 'cycle-1',
        membersIds: [],
        components: [
          generateTrainingComponent({
            id: 'c1',
            targetId: 'strength',
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e1' })],
              }),
            ],
          }),
        ],
      };

      dataWithoutTarget = {
        date: addDays(new Date(), 1),
        ownerId: global.trainer.id,
        institutionId,
        groupId,
        cycleId: 'cycle-1',
        membersIds: [],
        components: [
          generateTrainingComponent({
            id: 'c2',
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'e1' })],
              }),
            ],
          }),
        ],
      };
    });

    it('should periodize only trainings with selected target', async () => {
      await db.trainings.clear();

      const trainings = [
        // should only periodize 3 trainings (only 3 have targets)
        generateTrainingStub({ ...dataWithTarget, date: new Date() }), // from today
        generateTrainingStub(dataWithoutTarget),
        generateTrainingStub(dataWithTarget),
        generateTrainingStub(dataWithoutTarget),
        generateTrainingStub(dataWithTarget),
      ];

      const ids = await Promise.all(trainings.map((t) => db.trainings.save(t)));
      expect(ids).toHaveLength(5);

      const response = await request(ids[0], 'c1', {
        exerciseIds: ['e1'],
        periodizationType: PeriodizationType.REPLICATE,
      });

      expect(response.status).toBe(200);
      const body = response.body as Training[];
      expect(body).toHaveLength(3); // not 5 since only 3 trainings have component with target

      const resultTrainings = await db.trainings.findAll((q) =>
        q.where('id', 'in', ids),
      );

      const trainingsWithTarget = resultTrainings
        .filter((t) => t.components.some((c) => c.id === 'c1'))
        .filter((t) => t.id !== ids[0]); // filter out base training

      const trainingsWithoutTarget = resultTrainings.filter((t) =>
        t.components.some((c) => c.id === 'c2'),
      );

      expect(trainingsWithTarget).toHaveLength(2); // without base training
      for (const training of trainingsWithTarget) {
        const componentC1 = training.components.find((c) => c.id === 'c1');
        expect(componentC1).toBeDefined();
        expect(componentC1.copiedFrom).toEqual({
          lastCopiedFromTrainingId: ids[0],
          rootCopiedFromTrainingId: ids[0],
        });
      }

      expect(trainingsWithoutTarget).toHaveLength(2);
      for (const training of trainingsWithoutTarget) {
        const componentCNoTarget = training.components.find(
          (c) => c.id === 'c2',
        );
        expect(componentCNoTarget).toBeDefined();
        expect(componentCNoTarget.copiedFrom).toBeUndefined();
      }
    });

    it('should periodize trainings without target and keep those with target intact', async () => {
      await db.trainings.clear();

      const trainings = [
        // should only periodize 2 trainings (only 2 have no targets)
        generateTrainingStub({ ...dataWithoutTarget, date: new Date() }), // from today
        generateTrainingStub(dataWithTarget),
        generateTrainingStub(dataWithoutTarget),
        generateTrainingStub(dataWithTarget),
      ];

      const ids = await Promise.all(trainings.map((t) => db.trainings.save(t)));
      expect(ids).toHaveLength(4);

      const response = await request(ids[0], 'c2', {
        exerciseIds: ['e1'],
        periodizationType: PeriodizationType.REPLICATE,
      });

      expect(response.status).toBe(200);
      const body = response.body as Training[];
      expect(body).toHaveLength(2); // not 4 since only 2 trainings have component without target

      const resultTrainings = await db.trainings.findAll((q) =>
        q.where('id', 'in', ids),
      );

      const trainingsWithoutTarget = resultTrainings
        .filter((t) => t.components.some((c) => c.id === 'c2'))
        .filter((t) => t.id !== ids[0]); // filter out base training

      const trainingsWithTarget = resultTrainings.filter((t) =>
        t.components.some((c) => c.id === 'c1'),
      );

      expect(trainingsWithoutTarget).toHaveLength(1); // without base training
      for (const training of trainingsWithoutTarget) {
        const componentCNoTarget = training.components.find(
          (c) => c.id === 'c2',
        );
        expect(componentCNoTarget).toBeDefined();
        expect(componentCNoTarget.copiedFrom).toEqual({
          lastCopiedFromTrainingId: ids[0],
          rootCopiedFromTrainingId: ids[0],
        });
      }

      expect(trainingsWithTarget).toHaveLength(2);
      for (const training of trainingsWithTarget) {
        const componentC1 = training.components.find((c) => c.id === 'c1');
        expect(componentC1).toBeDefined();
        expect(componentC1.copiedFrom).toBeUndefined();
      }
    });
  });
});
