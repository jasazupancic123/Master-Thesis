import { TestApp } from '@test/common/utils/app.util';
import { subDays } from 'date-fns';

import type { TestInstitution, TestUser } from '@src/common/type/entity.type';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import type { Wellness } from '@src/profile/entity/wellness.entity';
import { WellnessService } from '@src/profile/service/wellness.service';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import type { TrainingComponent } from '@src/training/entity/training-component.entity';
import type { Workload } from '@src/training/entity/workload.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { generateWorkloadStub } from '@src/training/mock/workload.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';
import { TrainingService } from '@src/training/service/training.service';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({
    field: 'c1',
    params: ['reps', 'loadKg', 'loadRm', 'loadBw'],
  });

  return { Components: [c1] };
});

describe('Get Training By Athlete (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let exerciseService: ExerciseService;
  let wellnessService: WellnessService;
  let workloadRepository: WorkloadRepository;
  let trainingService: TrainingService;

  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;
  let a: TestUser;
  let b: TestUser;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    exerciseService = testApp.module.get(ExerciseService);
    wellnessService = testApp.module.get(WellnessService);
    workloadRepository = testApp.module.get(WorkloadRepository);
    trainingService = testApp.module.get(TrainingService);

    await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ name: 'Squat', components: ['c1'] }),
      generateExerciseStub({ name: 'Bench', components: ['c1'] }),
      generateExerciseStub({ name: 'Deadlift', components: ['c1'] }),
    ]);

    a = await testApp.auth.createAthlete();
    b = await testApp.auth.createAthlete();

    institution = await db.institutions.createTest({
      athletes: [global.athlete, a, b],
    });

    group = await db.groups.createTest(institution);
    trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [global.athlete.uid, a.uid, b.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            from: new Date(),
            supersets: [
              // main group only 1 superset and 1 exercise with 3 sets
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                      generateExerciseSet(3, { reps: 10, loadKg: 50 }),
                    ],
                  }),
                ],
              }),
            ],
            subgroups: [
              generateSubgroup({
                id: 'sg1',
                membersIds: [a.uid, b.uid],
                supersets: [
                  // subgroup has 2 supersets and 3 exercises (1, 2 and 3 sets each)
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({
                        id: 'squat',
                        sets: [
                          generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                        ],
                      }),
                    ],
                  }),
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({
                        id: 'bench',
                        sets: [
                          generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                          generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                        ],
                      }),
                      generateTrainingExercise({
                        id: 'deadlift',
                        sets: [
                          generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                          generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                          generateExerciseSet(3, { reps: 10, loadKg: 50 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              generateSubgroup({
                parentId: 'sg1',
                membersIds: [a.uid],
                supersets: [
                  // subgroup has 1 superset and 1 exercise with 5 sets
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({
                        id: 'x',
                        sets: [
                          generateExerciseSet(1, { reps: 10, loadKg: 50 }),
                          generateExerciseSet(2, { reps: 10, loadKg: 50 }),
                          generateExerciseSet(3, { reps: 10, loadKg: 50 }),
                          generateExerciseSet(4, { reps: 10, loadKg: 50 }),
                          generateExerciseSet(5, { reps: 10, loadKg: 50 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  });

  afterAll(async () => {
    await db.clear();
    await testApp.auth.deleteUsers([a.uid, b.uid]);
    await testApp.close();
  });

  function findExercise(training: Training, id: string) {
    return training.components[0].supersets[0].exercises.find(
      (e) => e.id === id,
    );
  }

  it('should get prescribed training for athlete for main group', async () => {
    const training = await db.trainings.findById(trainingId);
    // const response = await req(global.athlete, trainingId);
    const result = await trainingService.getTrainingByAthlete(
      global.athlete.uid,
      training,
    );

    const trainingComponents = result.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(1);
    expect(trainingComponent.supersets[0].exercises).toHaveLength(1);

    const firstExercise = trainingComponent.supersets[0].exercises[0];
    expect(firstExercise.id).toBe('squat');
    expect(firstExercise.sets).toHaveLength(3);

    const set = firstExercise.sets[0];
    expect(set.reps).toBe(10);
    expect(set.loadKg).toBe(50);

    // not defined params
    expect(set.repsR).toBeUndefined();
    expect(set.loadKgR).toBeUndefined();
    // expect(set.loadRm).toBeUndefined(); // not relevant
    expect(set.loadRmR).toBeUndefined();
    // expect(set.loadBw).toBeUndefined();
    expect(set.loadBwR).toBeUndefined();
    expect(set.tempoEcc).toBeUndefined();
    expect(set.tempoIso).toBeUndefined();
    expect(set.tempoCon).toBeUndefined();
    expect(set.tempoIdle).toBeUndefined();
    expect(set.tempoEccR).toBeUndefined();
    expect(set.tempoIsoR).toBeUndefined();
    expect(set.tempoConR).toBeUndefined();
    expect(set.tempoIdleR).toBeUndefined();
    expect(set.vel).toBeUndefined();
    expect(set.velR).toBeUndefined();
    expect(set.eff).toBeUndefined();
    expect(set.time).toBeUndefined();
    expect(set.dist).toBeUndefined();
    expect(set.recDist).toBeUndefined();
  });

  it('should get prescribed training for athlete for subgroup', async () => {
    const training = await db.trainings.findById(trainingId);
    const result = await trainingService.getTrainingByAthlete(b.uid, training);

    const trainingComponents = result.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(2);
    expect(trainingComponent.supersets[0].exercises).toHaveLength(1);
    expect(trainingComponent.supersets[1].exercises).toHaveLength(2);

    const firstExercise = trainingComponent.supersets[0].exercises[0];
    expect(firstExercise.id).toBe('squat');
    expect(firstExercise.sets).toHaveLength(1);

    const e1s1 = firstExercise.sets[0];
    expect(e1s1.reps).toBe(10);
    expect(e1s1.loadKg).toBe(50);
    expect(e1s1.repsR).toBeUndefined();
    expect(e1s1.loadKgR).toBeUndefined();
    // expect(e1s1.loadRm).toBeUndefined();
    expect(e1s1.loadRmR).toBeUndefined();
    // expect(e1s1.loadBw).toBeUndefined();
    expect(e1s1.loadBwR).toBeUndefined();
    expect(e1s1.tempoEcc).toBeUndefined();
    expect(e1s1.tempoIso).toBeUndefined();
    expect(e1s1.tempoCon).toBeUndefined();
    expect(e1s1.tempoIdle).toBeUndefined();
    expect(e1s1.tempoEccR).toBeUndefined();
    expect(e1s1.tempoIsoR).toBeUndefined();
    expect(e1s1.tempoConR).toBeUndefined();
    expect(e1s1.tempoIdleR).toBeUndefined();
    expect(e1s1.vel).toBeUndefined();
    expect(e1s1.velR).toBeUndefined();
    expect(e1s1.eff).toBeUndefined();
    expect(e1s1.time).toBeUndefined();
    expect(e1s1.dist).toBeUndefined();
    expect(e1s1.recDist).toBeUndefined();

    const secondExercise = trainingComponent.supersets[1].exercises[0];
    expect(secondExercise.id).toBe('bench');
    expect(secondExercise.sets).toHaveLength(2);

    const e2s1 = secondExercise.sets[0];
    expect(e2s1.reps).toBe(10);
    expect(e2s1.loadKg).toBe(50);
    expect(e2s1.repsR).toBeUndefined();
    expect(e2s1.loadKgR).toBeUndefined();
    // expect(e2s1.loadRm).toBeUndefined();
    expect(e2s1.loadRmR).toBeUndefined();
    // expect(e2s1.loadBw).toBeUndefined();
    expect(e2s1.loadBwR).toBeUndefined();
    expect(e2s1.tempoEcc).toBeUndefined();
    expect(e2s1.tempoIso).toBeUndefined();
    expect(e2s1.tempoCon).toBeUndefined();
    expect(e2s1.tempoIdle).toBeUndefined();
    expect(e2s1.tempoEccR).toBeUndefined();
    expect(e2s1.tempoIsoR).toBeUndefined();
    expect(e2s1.tempoConR).toBeUndefined();
    expect(e2s1.tempoIdleR).toBeUndefined();
    expect(e2s1.vel).toBeUndefined();
    expect(e2s1.velR).toBeUndefined();
    expect(e2s1.eff).toBeUndefined();
    expect(e2s1.time).toBeUndefined();
    expect(e2s1.dist).toBeUndefined();
    expect(e2s1.recDist).toBeUndefined();

    const thirdExercise = trainingComponent.supersets[1].exercises[1];
    expect(thirdExercise.id).toBe('deadlift');
    expect(thirdExercise.sets).toHaveLength(3);

    const e3s1 = thirdExercise.sets[0];
    expect(e3s1.reps).toBe(10);
    expect(e3s1.loadKg).toBe(50);
    expect(e3s1.repsR).toBeUndefined();
    expect(e3s1.loadKgR).toBeUndefined();
    // expect(e3s1.loadRm).toBeUndefined();
    expect(e3s1.loadRmR).toBeUndefined();
    // expect(e3s1.loadBw).toBeUndefined();
    expect(e3s1.loadBwR).toBeUndefined();
    expect(e3s1.loadBwR).toBeUndefined();
    expect(e3s1.tempoEcc).toBeUndefined();
    expect(e3s1.tempoIso).toBeUndefined();
    expect(e3s1.tempoCon).toBeUndefined();
    expect(e3s1.tempoIdle).toBeUndefined();
    expect(e3s1.tempoEccR).toBeUndefined();
    expect(e3s1.tempoIsoR).toBeUndefined();
    expect(e3s1.tempoConR).toBeUndefined();
    expect(e3s1.tempoIdleR).toBeUndefined();
    expect(e3s1.vel).toBeUndefined();
    expect(e3s1.velR).toBeUndefined();
    expect(e3s1.eff).toBeUndefined();
    expect(e3s1.time).toBeUndefined();
    expect(e3s1.dist).toBeUndefined();
    expect(e3s1.recDist).toBeUndefined();
  });

  it('should get prescribed training for athlete for child subgroup', async () => {
    const training = await db.trainings.findById(trainingId);
    const result = await trainingService.getTrainingByAthlete(a.uid, training);

    const trainingComponents = result.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(1); // child subgroup merged into parent for athlete
    expect(trainingComponent.supersets[0].exercises).toHaveLength(1);
    expect(trainingComponent.supersets[0].exercises[0].id).toBe('x');
    expect(trainingComponent.supersets[0].exercises[0].sets).toHaveLength(5);
  });

  it('should populate weight for exercises with bodyweight param', async () => {
    const wellnessRefToday = { uid: global.athlete.uid, date: new Date() };
    const wellnessRefYesterday = {
      ...wellnessRefToday,
      date: subDays(new Date(), 2),
    };

    // it should use this weight since it is more recent
    await db.wellness.save(
      {
        userId: global.athlete.uid,
        date: wellnessRefToday.date,
        weight: 85,
      },
      wellnessRefToday,
    );

    await db.wellness.save(
      {
        userId: global.athlete.uid,
        date: wellnessRefYesterday.date,
        weight: 60,
      },
      wellnessRefYesterday,
    );

    const trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [global.athlete.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift', // deadlift has bodyweight param
                    sets: [
                      generateExerciseSet(1, { loadBw: 75 }),
                      generateExerciseSet(2, { loadBw: 75 }),
                      generateExerciseSet(3, { loadBw: 75 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat', // squat does not have bodyweight param
                    sets: [
                      generateExerciseSet(1),
                      generateExerciseSet(2),
                      generateExerciseSet(3),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'bench', // bench has bodyweight param
                    sets: [
                      generateExerciseSet(1, { loadBw: 65 }),
                      generateExerciseSet(2, { loadBw: 65 }),
                      generateExerciseSet(3, { loadBw: 65 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const trainingBefore = await db.trainings.findById(trainingId);
    let deadlift = findExercise(trainingBefore, 'deadlift');
    let bench = findExercise(trainingBefore, 'bench');

    // all sets must have bw param of value 75 (% of bodyweight) for deadlift
    deadlift.sets.forEach((set) => {
      expect(set.loadBw).toBeDefined();
      expect(+set.loadBw).toBe(75);
    });

    // all sets must have bw param of value 65 for bench
    bench.sets.forEach((set) => {
      expect(set.loadBw).toBeDefined();
      expect(+set.loadBw).toBe(65);
    });

    const spy = jest.spyOn(wellnessService, 'getLastBodyweight');

    // insert wellness weight for athlete
    // const response = await req(global.athlete, trainingId);
    const trainingAfter = await trainingService.getTrainingByAthlete(
      global.athlete.uid,
      trainingBefore,
    );

    const spyResult = (await spy.mock.results[0].value) as Wellness;
    expect(spyResult).toBe(85);
    spy.mockRestore();

    deadlift = findExercise(trainingAfter, 'deadlift');
    bench = findExercise(trainingAfter, 'bench');

    // new deadlift param value should be 63.75 (85 * 0.75)
    deadlift.sets.forEach((set) => {
      expect(set.loadBw).toBe(75);
      expect(set.loadKg).toBe(64);
    });

    // new bench param value should be 55.25 (85 * 0.65)
    bench.sets.forEach((set) => {
      expect(set.loadBw).toBe(65);
      expect(set.loadKg).toBe(55.5);
    });

    // clear up
    await db.trainings.delete(trainingId);
    await db.wellness.delete(wellnessRefToday);
    await db.wellness.delete(wellnessRefYesterday);
  });

  it('should not call "getLatestWellnessByUser" if no bodyweight param', async () => {
    const trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [global.athlete.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat', // squat does not have bodyweight param
                    sets: [generateExerciseSet(1)],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const training = await db.trainings.findById(trainingId);
    const spy = jest.spyOn(wellnessService, 'getLatestByUser');
    await trainingService.getTrainingByAthlete(global.athlete.uid, training);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();

    await db.trainings.delete(trainingId);
  });

  it('should populate weight for exercises with rep max param', async () => {
    // create another (different) training before with workloads completed
    await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        membersIds: [global.athlete.uid],
      }),
    );

    function generateWorkload(
      exerciseId: string,
      date: Date,
      reps: number,
      weight: number,
    ) {
      return generateWorkloadStub({
        componentId: 'c1',
        trainingId: date.toISOString(),
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 1,
        status: SetStatus.NOT_STARTED,
        exerciseId,
        timestamp: date,
        reps,
        loadKg: weight,
        prescribed: { reps, loadKg: weight },
      });
    }

    const trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [global.athlete.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: 'c1',
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [
                      generateExerciseSet(1, { loadRm: 80 }),
                      generateExerciseSet(2, { loadRm: 80 }),
                      generateExerciseSet(3, { loadRm: 80 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'bench',
                    sets: [
                      generateExerciseSet(2, { loadRm: 65 }),
                      generateExerciseSet(3, { loadRm: 65 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1, { loadRm: 40 }),
                      generateExerciseSet(2, { loadRm: 40 }),
                      generateExerciseSet(3, { loadRm: 40 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const workloads = [
      generateWorkload('deadlift', subDays(new Date(), 7), 10, 130),
      generateWorkload('deadlift', subDays(new Date(), 3), 10, 140), // most recent
      generateWorkload('deadlift', subDays(new Date(), 5), 8, 150), // it should take this one since it has most weight
      generateWorkload('bench', subDays(new Date(), 10), 6, 70),
    ];

    await db.workloads.createMany(workloads);
    const allWorkloads = (await db.workloads.collectionGroup.get()).docs.map(
      (doc) => doc.data(),
    );

    expect(allWorkloads).toHaveLength(4);

    const trainingBefore = await db.trainings.findById(trainingId);
    let deadlift = findExercise(trainingBefore, 'deadlift');
    let bench = findExercise(trainingBefore, 'bench');
    let squat = findExercise(trainingBefore, 'squat');

    // all sets must have rm param of value 80 for deadlift
    deadlift.sets.forEach((set) => {
      expect(set.loadRm).toBeDefined();
      expect(+set.loadRm).toBe(80);
    });

    // all sets must have rm param of value 65 for bench
    bench.sets.forEach((set) => {
      expect(set.loadRm).toBeDefined();
      expect(+set.loadRm).toBe(65);
    });

    // all sets must have rm param of value 40 for squat
    squat.sets.forEach((set) => {
      expect(set.loadRm).toBeDefined();
      expect(+set.loadRm).toBe(40);
    });

    const spy = jest.spyOn(workloadRepository, 'findExerciseMax');
    const trainingAfter = await trainingService.getTrainingByAthlete(
      global.athlete.uid,
      trainingBefore,
    );

    expect(spy).toHaveBeenCalledTimes(3); // deadlift, bench, and squat
    const spyResults = await Promise.all(
      spy.mock.results.map((r) => r.value as Workload),
    );

    expect(spyResults.find((r) => r.exerciseId === 'deadlift').loadKg).toBe(
      150,
    );
    expect(spyResults.find((r) => r.exerciseId === 'bench').loadKg).toBe(70);
    spy.mockRestore();

    // 150 * 0.8 = 120 for deadlift
    // 70 * 0.65 = 45.5 for bench
    deadlift = findExercise(trainingAfter, 'deadlift');
    bench = findExercise(trainingAfter, 'bench');
    squat = findExercise(trainingAfter, 'squat');

    deadlift.sets.forEach((set) => {
      expect(set.loadRm).toBe(80); // prescribed value remains the same
      expect(set.loadKg).toBe(152);
    });

    bench.sets.forEach((set) => {
      expect(set.loadRm).toBe(65);
      expect(set.loadKg).toBe(54.5);
    });

    // squat should remain with default value since there is no previous workload
    squat.sets.forEach((set) => {
      expect(set.loadRm).toBe(40);
      expect(set.loadKg).toBe(20); // no data, so default value of 20 kg is used
    });

    // clear up
    await db.trainings.delete(trainingId);
  });
});
