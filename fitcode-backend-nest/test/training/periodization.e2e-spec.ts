import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { deleteCollection } from '@test/common/utils/data.util';
import { TestPeriodizationUtil } from '@test/common/utils/periodization.util';
import { addDays } from 'date-fns';
import * as req from 'supertest';

import { AppModule } from '@src/app.module';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { FirebaseService } from '@src/firebase/firebase.service';
import { generateCyclesStub } from '@src/group/mock/cycle.stub';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import type { Target } from '@src/target/entity/target.entity';
import { generateTargetStub } from '@src/target/mock/target.stub';
import { TestDbService } from '@src/test-db/test-db.service';
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

describe('Periodization functions (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let firebase: FirebaseService;

  let institutionId: string;
  let groupId: string;
  let target: Target;
  let component: Component;
  let baseTrainingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);

    target = generateTargetStub({
      id: 'strength',
      componentId: 'strength',
    });

    institutionId = await db.institutions.save(generateInstitutionStub());
    groupId = await db.groups.save(
      generateGroupStub({ institutionId, cycles: generateCyclesStub(3) }),
    );

    component = await db.components.create(
      generateComponentStub({ id: 'c1', targets: [target] }),
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
    await Promise.all([
      deleteCollection(firebase, 'TRAINING'),
      db.groups.delete(groupId),
      deleteCollection(firebase, 'EXERCISE'),
      db.institutions.delete(institutionId),
      db.components.delete(component.id),
    ]);

    await app.close();
  });

  async function request(
    trainingId: string,
    componentId: string,
    body: PeriodizeTrainingsDto = {
      exerciseIds: [],
      periodizationType: PeriodizationType.REPLICATE,
    },
  ) {
    return await req(app.getHttpServer())
      .patch(`/training/${trainingId}/periodize/component/${componentId}`)
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send(body);
  }

  it('should throw error if warmup / cooldown are passed as components', async () => {
    const response = await request(baseTrainingId, 'warmup');
    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'You cannot periodize warmup or cooldown components',
    );
  });

  it('should throw error if base training in the past', async () => {
    const pastTrainingId = await db.trainings.save(
      TestPeriodizationUtil.generateTraining(-1, {
        ownerId: global.trainer.id,
        institutionId,
        groupId,
      }),
    );

    const response = await request(pastTrainingId, component.id);
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

    const response = await request(baseTrainingId, component.id, {
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
    expect(baseComponent.id).toBe(component.id);
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

    await deleteCollection(firebase, 'TRAINING');
  });

  it('should periodize subgroups successfully', async () => {
    const newBaseTraining = generateTrainingStub({
      ownerId: global.trainer.id,
      membersIds: ['a', 'b', 'c'],
      date: new Date(),
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
    ];

    const ids = await Promise.all(trainings.map((t) => db.trainings.save(t)));

    // check that each exercise has sets of length 0, since only base training has sets which will override them
    const foundTrainings = await db.trainings.findAll((q) =>
      q.where('id', 'in', ids).orderBy('from', 'asc'),
    );

    expect(foundTrainings).toHaveLength(4);
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

    const result = response.body as Training[];
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
    };

    for (let i = 1; i < result.length; i++) {
      const training = result[i];
      expect(training.components).toHaveLength(1);

      const componentC1 = training.components[0];
      expect(componentC1.id).toBe('c1');
      expect(componentC1.completedMembersIds).toHaveLength(0);
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

    await deleteCollection(firebase, 'TRAINING');
  });
});
