import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/institution/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { CreateWorkload } from '@src/training/entity/workload.entity';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { generateTrainingComponentUserStatusStub } from '@src/training/mock/training-component-user-status.stub';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' });
  const c2 = generateComponentStub({ field: 'c2' });

  return { Components: [c1, c2] };
});

describe('Save User Exercise Stats (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;

  beforeAll(async () => {
    testApp = await TestApp.init();
    const exerciseService = testApp.module.get(ExerciseService);

    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest({
      createRandomAthlete: true,
      athletes: [global.athlete],
    });

    group = await db.groups.createTest(institution);

    await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ name: 'squat', components: ['c1'] }),
      generateExerciseStub({ name: 'bench', components: ['c1'] }),
      generateExerciseStub({ name: 'deadlift', components: ['c1'] }),
    ]);

    trainingId = await db.trainings.save(
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[0].id,
        ownerId: global.trainer.uid,
        membersIds: institution.athletes.map((a) => a.uid),
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [generateExerciseSet(1)],
                  }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [
                      generateExerciseSet(1),
                      generateExerciseSet(2),
                      generateExerciseSet(3),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [generateExerciseSet(1), generateExerciseSet(2)],
                  }),
                ],
              }),
            ],
          }),
          generateTrainingComponent({
            id: 'c2',
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat',
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
    );

    // start training component
    await db.trainingComponentUserStatus.save(
      generateTrainingComponentUserStatusStub(
        trainingId,
        'c1',
        global.athlete.uid,
      ),
    );
  });

  afterAll(async () => {
    await Promise.all([
      db.institutions.deleteTest(institution.id),
      db.exercises.clear(),
    ]);

    await testApp.close();
  });

  async function req(
    token: string,
    trainingId: string,
    componentId: string,
    exerciseId: string,
    supersetIndex: number,
    setNumber: number,
    body: CreateWorkload,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/exercise/${exerciseId}/superset/${supersetIndex}/set/${setNumber}`,
      token,
      body,
    );
  }

  it('should save user exercise stats if no stats exist for the exercise', async () => {
    await req(global.athlete.token, trainingId, 'c1', 'squat', 0, 1, {
      userId: global.athlete.uid,
      from: new Date(),
      to: new Date(),
      reps: 10,
      loadKg: 100,
    });

    const stats = await db.userExerciseStats.findById({
      uid: global.athlete.uid,
      exerciseId: 'squat',
    });

    expect(stats).toBeDefined();
    expect(stats.repMax!.loadKg).toBe(100);
    expect(stats.repMax!.reps).toBe(10);
  });

  it('should update user exercise stats if stats already exist for the exercise', async () => {
    await req(global.athlete.token, trainingId, 'c1', 'squat', 0, 1, {
      userId: global.athlete.uid,
      from: new Date(),
      to: new Date(),
      reps: 12,
      loadKg: 110,
    });

    const stats = await db.userExerciseStats.findById({
      uid: global.athlete.uid,
      exerciseId: 'squat',
    });

    expect(stats).toBeDefined();
    expect(stats.repMax!.loadKg).toBe(110);
    expect(stats.repMax!.reps).toBe(12);
  });

  it('should not save rep max if exercise does not have reps and load', async () => {
    await req(global.athlete.token, trainingId, 'c2', 'bench', 0, 1, {
      userId: global.athlete.uid,
      from: new Date(),
      to: new Date(),
      dist: 50,
      time: 10,
    });

    const stats = await db.userExerciseStats.findById({
      uid: global.athlete.uid,
      exerciseId: 'bench',
    });

    expect(stats).toBeNull();
  });
});
