import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import type { Training } from '@src/training/entity/training.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingReportService } from '@src/training/service/training-report.service';
import type { PrescribedTrainingStats } from '@src/training/type/training-report.type';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');

  const c1 = generateComponentStub({ field: 'c1' });
  const c2 = generateComponentStub({ field: 'c2' });

  return { Components: [c1, c2] };
});

describe('Training Report (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let trainingReportService: TrainingReportService;

  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    testApp = await TestApp.init();
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
                        dist: 30,
                        tempoEcc: 2,
                        tempoIso: 2,
                        tempoCon: 1,
                        tempoIdle: 0,
                        recTime: 0,
                      }),
                      generateExerciseSet(2, {
                        dist: 30,
                        tempoEcc: 2,
                        tempoIso: 2,
                        tempoCon: 1,
                        tempoIdle: 0,
                        recTime: 0,
                      }),
                      generateExerciseSet(3, {
                        dist: 30,
                        tempoEcc: 2,
                        tempoIso: 2,
                        tempoCon: 1,
                        tempoIdle: 0,
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

  async function startReq(
    token: string,
    trainingId: string,
    componentId: string,
  ) {
    return await testApp.http.post(
      `/training/${trainingId}/component/${componentId}/start`,
      token,
      {},
    );
  }

  it('should return default stats for training without any components', () => {
    const dummy = generateTrainingStub({
      ownerId: global.trainer.uid,
      membersIds: [global.athlete.uid],
    });

    const stats = trainingReportService.getPrescribedTrainingStats(dummy);
    expect(stats).toEqual({
      realization: 100,
      components: 0,
      exercises: 0,
      sets: 0,
      reps: 0,
      recTime: 0,
      tut: 0,
      tonnage: 0,
      dist: 0,
      recDist: 0,
      time: 0,
    } as PrescribedTrainingStats);
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

    const stats = trainingReportService.getPrescribedTrainingStats(dummy);
    expect(stats).toEqual({
      realization: 100,
      components: 2,
      exercises: 3, // unique
      sets: 6,
      reps: 6,
      recTime: 0,
      tut: 18, // 6 sets with default 3 seconds per rep tempo
      tonnage: 0,
      dist: 0,
      recDist: 0,
      time: 0,
    } as PrescribedTrainingStats);
  });

  it('should return correct training stats for provided training', () => {
    const stats = trainingReportService.getPrescribedTrainingStats(training);
    const tonnage = 10 * 10 * 50; // 5000 -> 8 sets of 10 reps with 50 kg
    const tut = 10 * 10 * 3; // 10 sets of 10 reps with 2010 (3 second) tempo and 3 sets of 1 rep with 5 second tempo

    expect(stats).toEqual({
      realization: 100,
      components: 2,
      exercises: 5,
      sets: 11,
      reps: 10 * 10, // 99 -> (8 + 2 unilateral) sets of 10 reps, 3 sets of 1 rep (defaults to 1 rep if no `reps` specified)
      recTime: 8 * 60, // 480 -> 8 sets with 60 sec recovery, 3 sets with 0 sec recovery (only effort based recovery)
      tut,
      tonnage,
      dist: 3 * 30, // 90 -> 3 sets of 30 m distance
      recDist: 0,
      time: 0,
    } as PrescribedTrainingStats);
  });

  it('should update existing report for user in training', async () => {
    await startReq(global.athlete.token, training.id, 'c1');

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

    const workloads = await db.workloads.getAll(training.id);
    const report = trainingReportService.getTrainingReportByUser(
      global.athlete.uid,
      training,
      workloads,
    );

    expect(report).toBeDefined();
    expect(report.sets).toBe(2);
    await db.workloads.deleteAll(training.id);
  });

  it('should calculate realization correctly', async () => {
    // c1.0 squat - 1st set 10 reps 50 kg 60 rec time
    // c1.0 bench - 1st set 10 reps each 50 kg each 60 rec time
    // bench - 2nd set 10 reps each 50 kg each 60 rec time
    // c1.1 deadlift - 1st set 1 rep 30 m 0 rec time tempo 2210
    // deadlift - 2nd set 1 rep 30 m 0 rec time tempo 2210
    // deadlift - 3rd set 1 rep 30 m 0 rec time tempo 2210
    // c1.1 squat - 1st set 10 reps 50 kg 60 rec time
    // squat - 2nd set 10 reps 50 kg 60 rec time
    // c2.0 squat - 1st set 10 reps 50 kg 60 rec time
    // squat - 2nd set 10 reps 50 kg 60 rec time
    // squat - 3rd set 10 reps 50 kg 60 rec time
    const userId = global.athlete.uid;

    function getTempo(
      tempoEcc: number,
      tempoIso: number,
      tempoCon: number,
      tempoIdle: number,
    ) {
      return { tempoEcc, tempoIso, tempoCon, tempoIdle };
    }

    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'squat',
        setNumber: 1,
        status: SetStatus.COMPLETED,
        reps: 10, // 25 %
        loadKg: 50, // 25 %
        recTime: 60, // 25 %
        ...getTempo(2, 0, 1, 0), // 25 %
        prescribed: {
          reps: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 0, 1, 0),
        },
      },
    ]);

    let workloads = await db.workloads.getAll(training.id);
    let report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );

    const totalSets = 11;
    expect(report.realization).toBeCloseTo(1 / totalSets); // because "set realization" is 100%

    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'bench',
        setNumber: 1,
        status: SetStatus.COMPLETED,
        reps: 5, // 12.5 %
        loadKg: 50, // 25 %
        recTime: 60, // 25 %
        ...getTempo(2, 0, 1, 0), // 25 %
        prescribed: {
          reps: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 0, 1, 0),
        },
      },
    ]);

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(1.875 / totalSets);

    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 0,
        exerciseId: 'bench',
        setNumber: 2,
        status: SetStatus.COMPLETED,
        reps: 10, // 25%
        loadKg: 75, // 1.5 * 0.25 = 37.5%
        recTime: 60, // 25 %
        ...getTempo(2, 0, 1, 0), // 25 %
        prescribed: {
          reps: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 0, 1, 0),
        },
      },
    ]); // 112.5 %

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(3 / totalSets);

    // c1.1 deadlift - 1st set 1 rep 30 m 0 rec time tempo 2210
    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 1,
        exerciseId: 'deadlift',
        setNumber: 1,
        status: SetStatus.COMPLETED,
        reps: 0, // 25 %
        dist: 30, // 25 %
        recTime: 0, // 25 %
        ...getTempo(2, 2, 1, 0), // 25 %
        prescribed: {
          reps: 0,
          dist: 30,
          recTime: 0,
          ...getTempo(2, 2, 1, 0),
        },
      },
    ]); // 100%

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(4 / totalSets);

    // deadlift - 2nd set 1 rep 30 m 0 rec time tempo 2210
    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 1,
        exerciseId: 'deadlift',
        setNumber: 2,
        status: SetStatus.COMPLETED,
        dist: 30, // 50 %
        recTime: 0, // not prescribed (it's 0) so it wont count as weight
        ...getTempo(2, 2, 1, 5), // 100 %
        prescribed: {
          dist: 30,
          recTime: 0,
          ...getTempo(2, 2, 1, 0),
        },
      },
    ]); // 150%

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(5.5 / totalSets);

    // deadlift - 3rd set 1 rep 30 m 0 rec time tempo 2210
    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 1,
        exerciseId: 'deadlift',
        setNumber: 3,
        status: SetStatus.COMPLETED,
        dist: 15, // 50 %
        recTime: 0, // not prescribed (it's 0) so it wont count as weight
        ...getTempo(1, 0, 0, 0), // 10 %
        prescribed: {
          dist: 30,
          recTime: 0,
          ...getTempo(2, 2, 1, 0),
        },
      },
    ]); // 60 %

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(6.1 / totalSets);

    // c1.1 squat - 1st set 10 reps 50 kg 60 rec time
    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 1,
        exerciseId: 'squat',
        setNumber: 1,
        status: SetStatus.COMPLETED,
        reps: 10,
        loadKg: 50,
        recTime: 60,
        ...getTempo(2, 2, 1, 0),
        prescribed: {
          reps: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 2, 1, 0),
        },
      },
    ]); // 100 %

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(7.1 / totalSets);

    // squat - 2nd set 10 reps 50 kg 60 rec time
    // check that more recovery time is worse
    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c1',
        supersetIndex: 1,
        exerciseId: 'squat',
        setNumber: 2,
        status: SetStatus.COMPLETED,
        reps: 10, // 25 %
        loadKg: 50, // 25 %
        recTime: 120, // 12.5 %
        ...getTempo(2, 2, 1, 0), // 25 %
        prescribed: {
          reps: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 2, 1, 0),
        },
      },
    ]); // 87.5 %

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(7.975 / totalSets);

    // c2.0 squat - 1st set 10 reps 50 kg 60 rec time
    // squat - 2nd set 10 reps 50 kg 60 rec time
    // squat - 3rd set 10 reps 50 kg 60 rec time
    await db.workloads.createMany([
      {
        userId,
        trainingId: training.id,
        componentId: 'c2',
        supersetIndex: 0,
        exerciseId: 'squat',
        setNumber: 1,
        status: SetStatus.COMPLETED,
        reps: 10,
        repsR: 12,
        loadKg: 50,
        recTime: 60,
        ...getTempo(2, 2, 1, 0),
        prescribed: {
          reps: 10,
          repsR: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 2, 1, 0),
        },
      }, // 105 %
      {
        userId,
        trainingId: training.id,
        componentId: 'c2',
        supersetIndex: 0,
        exerciseId: 'squat',
        setNumber: 2,
        status: SetStatus.COMPLETED,
        reps: 10,
        loadKg: 50,
        recTime: 60,
        ...getTempo(2, 2, 1, 0),
        prescribed: {
          reps: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 2, 1, 0),
        },
      }, // 100 %
      {
        userId,
        trainingId: training.id,
        componentId: 'c2',
        supersetIndex: 0,
        exerciseId: 'squat',
        setNumber: 3,
        status: SetStatus.COMPLETED,
        reps: 10,
        loadKg: 50,
        recTime: 60,
        ...getTempo(2, 2, 1, 0),
        prescribed: {
          reps: 10,
          loadKg: 50,
          recTime: 60,
          ...getTempo(2, 2, 1, 0),
        },
      }, // 100 %
    ]);

    workloads = await db.workloads.getAll(training.id);
    report = trainingReportService.getTrainingReportByUser(
      userId,
      training,
      workloads,
    );
    expect(report.realization).toBeCloseTo(11.025 / totalSets);

    // delete all workloads
    await db.workloads.deleteAll(training.id);
  });
});
