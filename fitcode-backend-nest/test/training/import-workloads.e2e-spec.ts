import { TestApp } from '@test/common/utils/app.util';
import { addDays, subDays } from 'date-fns';

import type {
  FirestoreEntity,
  TestInstitution,
} from '@src/common/type/entity.type';
import { GLOBAL_EXERCISE_OWNER } from '@src/exercise/constant/global-exercise-owner.constant';
import { TestDbService } from '@src/test-db/test-db.service';
import type {
  ImportWorkloadDto,
  Workload,
} from '@src/training/entity/workload.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';

describe('Get Trainings (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest();

    await Promise.all([
      // global exercises
      db.exercises.createTest({ id: 'g1', ownerId: GLOBAL_EXERCISE_OWNER }),
      db.exercises.createTest({ id: 'g2', ownerId: GLOBAL_EXERCISE_OWNER }),
      db.exercises.createTest({ id: 'g3', ownerId: GLOBAL_EXERCISE_OWNER }),
      // institution1 exercises
      db.exercises.createTest({ id: 'i1', institutionId: institution.id }),
      db.exercises.createTest({ id: 'i2', institutionId: institution.id }),
      // unknown institution exercises
      db.exercises.createTest({ id: 'x1', ownerId: 'unknown-institution' }),
      db.exercises.createTest({ id: 'x2', ownerId: 'unknown-institution' }),
    ]);
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, workloads: ImportWorkloadDto[]) {
    return testApp.http.post('/training/import-workloads', token, {
      workloads,
    });
  }

  it('should fail if user is not manager', async () => {
    const res1 = await req(global.trainer.token, []);
    expect(res1.status).toBe(403);

    const res2 = await req(global.athlete.token, []);
    expect(res2.status).toBe(403);

    const res3 = await req(global.admin.token, []);
    expect(res3.status).toBe(403);
  });

  it('should fail if user not found', async () => {
    const res = await req(global.manager.token, [
      {
        exerciseId: 'g1',
        email: 'not-found@mail.com',
        date: new Date(),
        setNumber: 1,
      },
    ]);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });

  it('should fail if user is not athlete', async () => {
    const res = await req(global.manager.token, [
      {
        exerciseId: 'g1',
        email: global.trainer.email,
        date: new Date(),
        setNumber: 1,
      },
    ]);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('not an athlete');
  });

  it('should fail if date is not in the past', async () => {
    const res = await req(global.manager.token, [
      {
        exerciseId: 'g1',
        email: global.athlete.email,
        date: addDays(new Date(), 1),
        setNumber: 1,
      },
    ]);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('must be in the past');
  });

  it('should fail if exercises are not in institution', async () => {
    const res = await req(global.manager.token, [
      {
        exerciseId: 'x1',
        email: global.athlete.email,
        date: subDays(new Date(), 1),
        setNumber: 1,
      },
    ]);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid exerciseId');
  });

  it('should fail if set number is invalid', async () => {
    const res = await req(global.manager.token, [
      {
        exerciseId: 'g1',
        email: global.athlete.email,
        date: subDays(new Date(), 1),
        setNumber: 0,
      },
    ]);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Set number');
  });

  it('should successfully import workloads', async () => {
    const res = await req(global.manager.token, [
      {
        exerciseId: 'g1',
        email: global.athlete.email,
        date: subDays(new Date(), 2),
        setNumber: 1,
        reps: 10,
        loadKg: 50,
      },
      {
        exerciseId: 'g2',
        email: global.athlete.email,
        date: subDays(new Date(), 2),
        setNumber: 2,
        reps: 12,
        loadKg: 52,
      },
      {
        exerciseId: 'i1',
        email: global.athlete.email,
        date: subDays(new Date(), 2),
        setNumber: 1,
        reps: 14,
        loadKg: 54,
      },
    ]);

    expect(res.status).toBe(201);

    const workloads = (await db.workloads.collectionGroup.get()).docs.map(
      (doc) =>
        testApp.firebase.serialize(doc.data() as FirestoreEntity<Workload>),
    );

    expect(workloads.length).toBe(3);

    const wG1 = workloads.find(
      (w) => w.exerciseId === 'g1' && w.setNumber === 1,
    );
    expect(wG1.reps).toBe(10);
    expect(wG1.loadKg).toBe(50);
    expect(wG1.componentId).toBe('strength');
    expect(wG1.supersetIndex).toBe(0);
    expect(wG1.status).toBe(SetStatus.COMPLETED);
    expect(wG1.prescribed.reps).toBe(10);
    expect(wG1.prescribed.loadKg).toBe(50);
    expect(wG1.from).toBeDefined();
    expect(wG1.to).toBeDefined();
    expect(wG1.userId).toBe(global.athlete.uid);
    expect(wG1.institutionId).toBe(institution.id);
    expect(wG1.groupId).toBeUndefined();
    expect(wG1.cycleId).toBeUndefined();
    expect(wG1.trainingId).toBe(res.body.id);

    const wG2 = workloads.find(
      (w) => w.exerciseId === 'g2' && w.setNumber === 2,
    );
    expect(wG2.reps).toBe(12);
    expect(wG2.loadKg).toBe(52);
    expect(wG2.componentId).toBe('strength');
    expect(wG2.supersetIndex).toBe(0);
    expect(wG2.status).toBe(SetStatus.COMPLETED);
    expect(wG2.prescribed.reps).toBe(12);
    expect(wG2.prescribed.loadKg).toBe(52);
    expect(wG1.from).toBeDefined();
    expect(wG1.to).toBeDefined();
    expect(wG2.userId).toBe(global.athlete.uid);
    expect(wG2.institutionId).toBe(institution.id);
    expect(wG2.groupId).toBeUndefined();
    expect(wG2.cycleId).toBeUndefined();
    expect(wG2.trainingId).toBe(res.body.id);

    const wI1 = workloads.find(
      (w) => w.exerciseId === 'i1' && w.setNumber === 1,
    );
    expect(wI1.reps).toBe(14);
    expect(wI1.loadKg).toBe(54);
    expect(wI1.componentId).toBe('strength');
    expect(wI1.supersetIndex).toBe(0);
    expect(wI1.status).toBe(SetStatus.COMPLETED);
    expect(wI1.prescribed.reps).toBe(14);
    expect(wI1.prescribed.loadKg).toBe(54);
    expect(wG1.from).toBeDefined();
    expect(wG1.to).toBeDefined();
    expect(wI1.userId).toBe(global.athlete.uid);
    expect(wI1.institutionId).toBe(institution.id);
    expect(wI1.groupId).toBeUndefined();
    expect(wI1.cycleId).toBeUndefined();
    expect(wI1.trainingId).toBe(res.body.id);

    // training should be created
    const training = await db.trainings.findById(res.body.id);
    expect(training).toBeDefined();
    expect(training.institutionId).toBe(institution.id);

    // clear
    await db.trainings.recursiveDelete(res.body.id);
  });

  it('should successfully import duplicate workloads', async () => {
    let res = await req(global.manager.token, [
      {
        exerciseId: 'g1',
        email: global.athlete.email,
        date: subDays(new Date(), 2),
        setNumber: 1,
        reps: 10,
        loadKg: 50,
      },
    ]);

    expect(res.status).toBe(201);

    let workloads = (await db.workloads.collectionGroup.get()).docs.map((doc) =>
      testApp.firebase.serialize(doc.data() as FirestoreEntity<Workload>),
    );

    expect(workloads.length).toBe(1);

    res = await req(global.manager.token, [
      {
        exerciseId: 'g1',
        email: global.athlete.email,
        date: subDays(new Date(), 2),
        setNumber: 1,
        reps: 10,
        loadKg: 50,
      },
    ]);

    expect(res.status).toBe(201);

    workloads = (await db.workloads.collectionGroup.get()).docs.map((doc) =>
      testApp.firebase.serialize(doc.data() as FirestoreEntity<Workload>),
    );

    expect(workloads.length).toBe(2);
  });
});
