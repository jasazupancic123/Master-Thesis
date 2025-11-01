import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { TrainingReportRef } from '@src/common/type/firestore.type';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import type { Training } from '@src/training/entity/training.entity';
import type { TrainingReport } from '@src/training/entity/training-report.entity';
import type { TrainingStats } from '@src/training/entity/training-stats.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingReportService } from '@src/training/service/training-report.service';
import { WorkloadService } from '@src/training/service/workload.service';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' });
  const c2 = generateComponentStub({ field: 'c2' });
  const warmup = generateComponentStub({ field: 'warmup' });
  const cooldown = generateComponentStub({ field: 'cooldown' });

  return {
    WARMUP_ID: 'warmup',
    COOLDOWN_ID: 'cooldown',
    WARMUP: warmup,
    COOLDOWN: cooldown,
    Components: [warmup, c1, c2, cooldown],
  };
});

describe('Training Report (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let workloadService: WorkloadService;
  let trainingReportService: TrainingReportService;

  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();
    workloadService = testApp.module.get(WorkloadService);
    trainingReportService = testApp.module.get(TrainingReportService);
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

    const trainingId = await db.trainings.save(
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
                    sets: [
                      generateExerciseSet(1, {
                        reps: 10,
                        loadKg: 50,
                        recTime: 60,
                      }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'bench',
                    sets: [
                      generateExerciseSet(1, {
                        reps: 10,
                        repsR: 10,
                        loadKg: 50,
                        loadKgR: 50,
                        recTime: 60,
                      }),
                      generateExerciseSet(2, {
                        reps: 10,
                        repsR: 10,
                        loadKg: 50,
                        loadKgR: 50,
                        recTime: 60,
                      }),
                    ],
                  }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [
                      generateExerciseSet(1, {
                        reps: 1,
                        dist: 30,
                        tempo: '2:0:1:0',
                        recTime: 0,
                      }),
                      generateExerciseSet(2, {
                        reps: 1,
                        dist: 30,
                        tempo: '2:0:1:0',
                        recTime: 0,
                      }),
                      generateExerciseSet(3, {
                        reps: 1,
                        dist: 30,
                        tempo: '2:0:1:0',
                        recTime: 0,
                      }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1, {
                        reps: 10,
                        loadKg: 50,
                        recTime: 60,
                      }),
                      generateExerciseSet(2, {
                        reps: 10,
                        loadKg: 50,
                        recTime: 60,
                      }),
                    ],
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
                      generateExerciseSet(1, {
                        reps: 10,
                        loadKg: 50,
                        recTime: 60,
                      }),
                      generateExerciseSet(2, {
                        reps: 10,
                        loadKg: 50,
                        recTime: 60,
                      }),
                      generateExerciseSet(3, {
                        reps: 10,
                        loadKg: 50,
                        recTime: 60,
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

    training = await db.trainings.findById(trainingId);
  });

  afterAll(async () => {
    await Promise.all([
      db.trainings.clear(),
      db.groups.delete(group.id),
      db.institutions.remove(institution.id),
      db.trainings.delete(training.id),
      db.exercises.clear(),
    ]);

    await testApp.close();
  });

  it('should return default stats for training without any components', () => {
    const dummy = generateTrainingStub({
      ownerId: global.trainer.uid,
      membersIds: [global.athlete.uid],
    });

    const stats = trainingReportService.getTrainingStats(dummy);
    expect(stats).toEqual({
      plannedComponents: [],
      totalDuration: 120,
      totalComponents: 0,
      totalSupersets: 0,
      totalExercises: 0,
      totalSets: 0,
      totalReps: 0,
      totalRecTime: 0,
      totalTit: 0,
      totalTonnage: 0,
    } as TrainingReport);
  });

  it('should return correct training stats for training with empty exercises', () => {
    const set: Partial<ExerciseSet> = { reps: 1, recTime: 0 };

    const dummy = generateTrainingStub({
      ownerId: global.trainer.uid,
      membersIds: [global.athlete.uid],
      components: [
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: 'squat',
                  sets: [generateExerciseSet(1, set)],
                }),
                generateTrainingExercise({
                  id: 'bench',
                  sets: [
                    generateExerciseSet(1, set),
                    generateExerciseSet(2, set),
                  ],
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
                  id: 'deadlift',
                  sets: [
                    generateExerciseSet(1, set),
                    generateExerciseSet(2, set),
                    generateExerciseSet(3, set),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const stats = trainingReportService.getTrainingStats(dummy);
    expect(stats).toEqual({
      plannedComponents: [
        { componentId: 'c1', totalSets: 3 },
        { componentId: 'c2', totalSets: 3 },
      ],
      totalDuration: 120,
      totalComponents: 2,
      totalSupersets: 2,
      totalExercises: 3, // unique
      totalSets: 6,
      totalReps: 6,
      totalRecTime: 0,
      totalTit: 18, // 6 sets with default 3 seconds per rep tempo
      totalTonnage: 0,
    } as TrainingStats);
  });

  it('should return correct training stats for provided training', () => {
    const stats = trainingReportService.getTrainingStats(training);
    const totalTonnage = 10 * 10 * 50; // 5000 -> 8 sets of 10 reps with 50 kg
    const totalActiveTime = 10 * 10 * 3 + 3 * 30 * 1; // 300 + 90 = 390 -> 10 sets of 10 reps with 2010 (3 second) tempo, 3 sets of 30 m distance with 1 second per meter

    expect(stats).toEqual({
      plannedComponents: [
        { componentId: 'c1', totalSets: 8 },
        { componentId: 'c2', totalSets: 3 },
      ],
      totalDuration: 120,
      totalComponents: 2,
      totalSupersets: 3,
      totalExercises: 3, // unique
      totalSets: 11,
      totalReps: 10 * 10 + 3 * 1, // 99 -> (8 + 2 unilateral) sets of 10 reps, 3 sets of 1 rep (defaults to 1 rep if no `reps` specified)
      totalRecTime: 8 * 60, // 480 -> 8 sets with 60 sec recovery, 3 sets with 0 sec recovery (only effort based recovery)
      totalTit: totalActiveTime,
      totalTonnage,
      totalDistVol: 3 * 30, // 90 -> 3 sets of 30 m distance
    } as TrainingStats);
  });

  it('should create new report if it does not exist yet for user in training', async () => {
    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    await trainingReportService.updateReport(global.athlete.uid, training);

    // no workloads should be found
    expect(await spy.mock.results[0].value).toHaveLength(0);
    spy.mockRestore();

    // report should be created
    const ref: TrainingReportRef = {
      trainingId: training.id,
      userId: global.athlete.uid,
    };

    const report = await db.trainingReports.findById(ref);
    expect(report).toBeDefined();
    expect(report.sets).toBe(0);

    await db.workloads.deleteAll(training.id);
    await db.trainingReports.delete(ref);
  });

  it('should update existing report for user in training', async () => {
    await db.workloads.createMany([
      {
        userId: global.athlete.uid,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'squat',
        setNumber: 1,
        status: SetStatus.COMPLETED,
        reps: 1,
        recTime: 0,
        prescribed: { reps: 1, recTime: 0 },
      },
      {
        userId: global.athlete.uid,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'squat',
        setNumber: 2,
        status: SetStatus.COMPLETED,
        reps: 1,
        recTime: 0,
        prescribed: { reps: 1, recTime: 0 },
      },
    ]);

    const spy = jest.spyOn(workloadService, 'findAllByUserTraining');
    await trainingReportService.updateReport(global.athlete.uid, training);

    // workloads should be found
    expect((await spy.mock.results[0].value).length).toBe(2);
    spy.mockRestore();

    // report should be updated
    const ref: TrainingReportRef = {
      trainingId: training.id,
      userId: global.athlete.uid,
    };

    const report = await db.trainingReports.findById(ref);

    expect(report).toBeDefined();
    expect(report.sets).toBe(2);

    await db.workloads.deleteAll(training.id);
    await db.trainingReports.delete(ref);
  });

  it('should add photos to report', async () => {
    const photoURLs = ['photo1', 'photo2'];
    await trainingReportService.updateReport(global.athlete.uid, training, {
      photoURLs,
    });

    const ref: TrainingReportRef = {
      trainingId: training.id,
      userId: global.athlete.uid,
    };

    const report = await db.trainingReports.findById(ref);
    expect(report).toBeDefined();
    expect(report.photoURLs).toEqual(photoURLs);

    // add more photos
    const newPhotoURLs = ['photo3', 'photo4'];
    await trainingReportService.updateReport(global.athlete.uid, training, {
      photoURLs: newPhotoURLs,
    });

    const updatedReport = await db.trainingReports.findById(ref);
    expect(updatedReport).toBeDefined();
    expect(updatedReport.photoURLs).toEqual(newPhotoURLs);

    await db.workloads.deleteAll(training.id);
    await db.trainingReports.delete(ref);
  });

  /* it('should calculate realization correctly', async () => {
    // 3 sets 10 reps, 50 kg, 60 second recovery
    //   - 1st set 100% completed
    //   - 2nd set 80% completed
    //   - 3rd set 50% completed
    // => total realization: (100 + 80 + 50) / 300 = 76.67%

    await db.workloads.createMany([
      {
        // first set fully completed
        userId: global.athlete.uid,
        trainingId: training.id,
        component: component2,
        supersetIndex: 0,
        exerciseId: 'pullup',
        setNumber: 1,
        status: SetStatus.COMPLETED,
        volWork1ValueL: 10,
        intWork1ValueL: 50,
        volRecValueL: 60,
      },
      {
        // second set 80% completed
        userId: global.athlete.uid,
        trainingId: training.id,
        component: component2,
        supersetIndex: 0,
        exerciseId: 'pullup',
        setNumber: 2,
        status: SetStatus.COMPLETED,
        volWork1ValueL: 8,
        intWork1ValueL: 40,
        volRecValueL: 72,
      },
      {
        // third set 50% completed
        userId: global.athlete.uid,
        trainingId: training.id,
        component: component2,
        supersetIndex: 0,
        exerciseId: 'pullup',
        setNumber: 3,
        status: SetStatus.COMPLETED,
        volWork1ValueL: 5,
        intWork1ValueL: 25,
        volRecValueL: 90,
      },
    ]);

    await trainingReportService.updateReport(global.athlete.uid, training);

    const ref: TrainingReportRef = {
      trainingId: training.id,
      userId: global.athlete.uid,
    };

    const report = await db.trainingReports.findById(ref);
    expect(report).toBeDefined();
    expect(report.sets).toBe(3);
    expect(report.realization).toBeCloseTo(76.67, 1);

    await db.workloads.deleteAll(training.id);
    await db.trainingReports.delete(ref);
  }); */
});
