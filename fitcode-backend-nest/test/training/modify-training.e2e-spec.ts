import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import type { Group } from '@src/institution/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import {
  TrainingAction,
  type TrainingActionPayloadDto,
} from '@src/training/dto/training-action.dto';
import type { Training } from '@src/training/entity/training.entity';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';

describe('Modify Training (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let exercise: Exercise;
  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    exercise = await db.exercises.createTest({ id: 'e1' });
    institution = await db.institutions.createTest();
    group = await db.groups.createTest(institution);
    training = await clearAndResetTraining();
  });

  async function clearAndResetTraining() {
    await db.trainings.clear();
    return await db.trainings.createTest(group, {
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
        }),
      ],
    });
  }

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(
    token: string,
    trainingId: string,
    body: TrainingActionPayloadDto,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/modify`,
      token,
      body,
    );
  }

  it('should not allow to modify training for user that is not assigned to training', async () => {
    const user = await testApp.auth.createAthlete();
    const res = await req(user.token, training.id, {
      action: TrainingAction.ADD_EXERCISE,
      ref: {},
      payload: {},
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this training');
    await testApp.auth.deleteUser(user.uid);
  });

  it('should throw error if provided exercise is not found', async () => {
    const res = await req(global.athlete.token, training.id, {
      action: TrainingAction.ADD_EXERCISE,
      ref: { componentId: 'c1', exerciseId: 'invalid-exercise-id' },
      payload: {},
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Exercise does not exist');
  });

  it('should throw error if user is athlete and tries to modify training without componentId', async () => {
    const res = await req(global.athlete.token, training.id, {
      action: TrainingAction.ADD_EXERCISE,
      ref: { exerciseId: exercise.id },
      payload: {},
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You must provide componentId');
  });

  it('should successfully add exercise to superset for coach', async () => {
    const newExercise = await db.exercises.createTest({ id: 'e2' });
    const res = await req(global.trainer.token, training.id, {
      action: TrainingAction.ADD_EXERCISE,
      ref: { componentId: 'c1', supersetIndex: 0, exerciseId: 'e2' },
      payload: {},
    });

    expect(res.status).toBe(201);

    const dbTraining = await db.trainings.findById(training.id);
    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups.length).toBe(0); // no subgroups for coach

    const superset = dbTraining.components[0].supersets[0];
    expect(superset.exercises.length).toBe(2);

    training = await clearAndResetTraining();
    await db.exercises.delete(newExercise.id);
  });

  it('should successfully add exercise to superset for athlete', async () => {
    const newExercise = await db.exercises.createTest({ id: 'e2' });
    const res = await req(global.athlete.token, training.id, {
      action: TrainingAction.ADD_EXERCISE,
      ref: { componentId: 'c1', supersetIndex: 0, exerciseId: 'e2' },
      payload: {},
    });

    expect(res.status).toBe(201);

    const dbTraining = await db.trainings.findById(training.id);
    expect(dbTraining.components[0].supersets[0].exercises.length).toBe(1); // main group should not be changed

    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups.length).toBe(1); // athlete should be moved to virtual subgroup

    const athleteSubgroup = subgroups[0];
    expect(athleteSubgroup.supersets[0].exercises.length).toBe(2);

    training = await clearAndResetTraining();
    await db.exercises.delete(newExercise.id);
  });

  it('should successfully remove exercise from superset for coach', async () => {
    const res = await req(global.trainer.token, training.id, {
      action: TrainingAction.REMOVE_EXERCISE,
      ref: { componentId: 'c1', supersetIndex: 0, exerciseId: 'e1' },
      payload: {},
    });

    expect(res.status).toBe(201);

    const dbTraining = await db.trainings.findById(training.id);
    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups.length).toBe(0); // no subgroups for coach

    const superset = dbTraining.components[0].supersets[0];
    expect(superset.exercises.length).toBe(0);

    training = await clearAndResetTraining();
  });

  it('should successfully remove exercise from superset for athlete', async () => {
    const res = await req(global.athlete.token, training.id, {
      action: TrainingAction.REMOVE_EXERCISE,
      ref: { componentId: 'c1', supersetIndex: 0, exerciseId: 'e1' },
      payload: {},
    });

    expect(res.status).toBe(201);
    const dbTraining = await db.trainings.findById(training.id);
    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups.length).toBe(1); // athlete should be moved to virtual subgroup

    const athleteSubgroup = subgroups[0];
    expect(athleteSubgroup.supersets[0].exercises.length).toBe(0);

    expect(dbTraining.components[0].supersets[0].exercises.length).toBe(1);
    training = await clearAndResetTraining();
  });

  it('should successfully add set to exercise for coach', async () => {
    const res = await req(global.trainer.token, training.id, {
      action: TrainingAction.ADD_SET,
      ref: { componentId: 'c1', supersetIndex: 0, exerciseId: 'e1' },
      payload: {
        set: generateExerciseSet(4),
      },
    });

    expect(res.status).toBe(201);

    const dbTraining = await db.trainings.findById(training.id);
    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups).toHaveLength(0);

    const superset = dbTraining.components[0].supersets[0];
    const trainingExercise = superset.exercises.find((ex) => ex.id === 'e1');
    expect(trainingExercise.sets.length).toBe(4);

    training = await clearAndResetTraining();
  });

  it('should successfully add set to exercise for athlete', async () => {
    const res = await req(global.athlete.token, training.id, {
      action: TrainingAction.ADD_SET,
      ref: { componentId: 'c1', supersetIndex: 0, exerciseId: 'e1' },
      payload: {
        set: generateExerciseSet(4),
      },
    });

    expect(res.status).toBe(201);

    const dbTraining = await db.trainings.findById(training.id);
    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups.length).toBe(1); // athlete should be moved to virtual subgroup

    const athleteSubgroup = subgroups[0];
    expect(
      athleteSubgroup.supersets[0].exercises.find((ex) => ex.id === 'e1').sets
        .length,
    ).toBe(4);

    expect(
      dbTraining.components[0].supersets[0].exercises.find(
        (ex) => ex.id === 'e1',
      ).sets.length,
    ).toBe(3);

    training = await clearAndResetTraining();
  });

  it('should successfully remove set from exercise for coach', async () => {
    const res = await req(global.trainer.token, training.id, {
      action: TrainingAction.REMOVE_SET,
      ref: {
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'e1',
        setNumber: 1,
      },
      payload: {},
    });

    expect(res.status).toBe(201);

    const dbTraining = await db.trainings.findById(training.id);
    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups).toHaveLength(0);

    const superset = dbTraining.components[0].supersets[0];
    const trainingExercise = superset.exercises.find((ex) => ex.id === 'e1');
    expect(trainingExercise.sets.length).toBe(2);

    training = await clearAndResetTraining();
  });

  it('should successfully remove set from exercise for athlete', async () => {
    const res = await req(global.athlete.token, training.id, {
      action: TrainingAction.REMOVE_SET,
      ref: {
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'e1',
        setNumber: 1,
      },
      payload: {},
    });

    expect(res.status).toBe(201);

    const dbTraining = await db.trainings.findById(training.id);
    const subgroups = dbTraining.components[0].subgroups;
    expect(subgroups.length).toBe(1); // athlete should be moved to virtual subgroup

    const athleteSubgroup = subgroups[0];
    expect(
      athleteSubgroup.supersets[0].exercises.find((ex) => ex.id === 'e1').sets
        .length,
    ).toBe(2);

    expect(
      dbTraining.components[0].supersets[0].exercises.find(
        (ex) => ex.id === 'e1',
      ).sets.length,
    ).toBe(3);

    training = await clearAndResetTraining();
  });
});
