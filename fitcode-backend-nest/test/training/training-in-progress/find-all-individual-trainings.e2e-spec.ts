import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Group } from '@src/institution/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import type { Workload } from '@src/training/entity/workload.entity';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';

describe('Find All Individual Trainings (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();

    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest({
      createRandomAthlete: true,
      athletes: [global.athlete],
    });

    group = await db.groups.createTest(institution);
    training = await db.trainings.createTest(group, {
      membersIds: [institution.athletes[0].uid, institution.athletes[1].uid],
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
              ],
            }),
          ],
          subgroups: [
            generateSubgroup({
              membersIds: [institution.athletes[1].uid],
              supersets: [
                generateSuperset({
                  exercises: [
                    generateTrainingExercise({
                      id: 'e2',
                      sets: [generateExerciseSet(1), generateExerciseSet(2)],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  afterAll(async () => {
    await db.institutions.deleteTest(institution.id);
    await db.clear();
  });

  async function req(token: string, trainingId: string) {
    return await testApp.http.get(`/training/${trainingId}/individual`, token);
  }

  it('should throw error if training not found', async () => {
    const res = await req(global.trainer.token, 'non-existing-id');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Training not found');
  });

  it('should return individual training for athletes', async () => {
    const res = await req(global.trainer.token, training.id);
    expect(res.status).toBe(200);

    const user1Training = res.body[institution.athletes[0].uid] as Training & {
      workloads: Workload[];
    };
    const user2Training = res.body[institution.athletes[1].uid] as Training & {
      workloads: Workload[];
    };

    expect(user1Training).toBeDefined();
    expect(user2Training).toBeDefined();
    expect(user1Training.id).toBe(training.id);
    expect(user2Training.id).toBe(training.id);

    // user1 should have only his supersets
    expect(user1Training.components).toHaveLength(1);
    expect(user1Training.components[0].id).toBe('c1');
    expect(user1Training.components[0].supersets).toHaveLength(1);
    expect(user1Training.components[0].supersets[0].exercises).toHaveLength(1);
    expect(user1Training.components[0].supersets[0].exercises[0].id).toBe('e1');
    expect(user1Training.components[0].subgroups).toHaveLength(0);

    // user2 should have subgroup supersets
    expect(user2Training.components).toHaveLength(1);
    expect(user2Training.components[0].id).toBe('c1');
    expect(user2Training.components[0].supersets).toHaveLength(1);
    expect(user2Training.components[0].supersets[0].exercises).toHaveLength(1);
    expect(user2Training.components[0].supersets[0].exercises[0].id).toBe('e2');
    expect(user2Training.components[0].subgroups).toHaveLength(0);

    // clean up
    await db.trainingComponentUserStatus.deleteAllByTraining(training.id);
  });
});
