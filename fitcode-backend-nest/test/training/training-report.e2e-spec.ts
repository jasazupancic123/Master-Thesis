import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { AppModule } from '@src/app.module';
import type { TestInstitution } from '@src/common/type/entity.type';
import { ParamType } from '@src/component/enum/param.enum';
import { generateComponentParamsStub } from '@src/component/mock/component-param.stub';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import type { Group } from '@src/group/entity/group.entity';
import { TestDbService } from '@src/test-db/test-db.service';
import type { Training } from '@src/training/entity/training.entity';
import type { TrainingStats } from '@src/training/entity/training-stats.entity';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingReportService } from '@src/training/service/training-report.service';
import { WorkloadService } from '@src/training/service/workload.service';

describe('Training Report (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let workloadService: WorkloadService;
  let trainingReportService: TrainingReportService;

  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    workloadService = moduleFixture.get(WorkloadService);
    trainingReportService = moduleFixture.get(TrainingReportService);
    const exerciseService = moduleFixture.get(ExerciseService);
    await app.init();

    db = moduleFixture.get(TestDbService);
    institution = await db.institutions.createTest({
      createRandomAthlete: true,
      athletes: [global.athlete],
    });

    group = await db.groups.createTest(institution);

    await Promise.all([
      db.components.create({ id: 'c1' }),
      db.components.create({ id: 'c2' }),
    ]);

    await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ name: 'squat', componentIds: ['c1'] }),
      generateExerciseStub({ name: 'bench', componentIds: ['c1'] }),
      generateExerciseStub({ name: 'deadlift', componentIds: ['c1'] }),
    ]);

    const opt1 = generateComponentParamsStub([
      ParamType.VolWorkSets, // sets
      ParamType.VolWork1, // reps, defaults to 12 reps
      ParamType.IntWork1, // kg, defaults to 20 kg
      ParamType.VolRec1, // rec, defaults to 60 sec
    ]);

    const opt2 = generateComponentParamsStub([
      ParamType.VolWorkSets, // sets
      ParamType.VolWork2, // dist, defaults to 30 m
      ParamType.IntWork2, // tempo, defaults to 2010
      ParamType.IntRec1, // eff, defaults to 1 (easy)
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
                    sets: [generateExerciseSet(1, opt1)], // 12 reps, 20 kg, 60 second recovery
                  }),
                  generateTrainingExercise({
                    id: 'bench',
                    sets: [
                      generateExerciseSet(1, opt1, { bilateral: true }), // 12 reps, 20 kg, 60 second recovery
                      generateExerciseSet(2, opt1, { bilateral: true }), // 12 reps, 20 kg, 60 second recovery
                    ],
                  }),
                ],
              }),
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift',
                    sets: [
                      generateExerciseSet(1, opt2), // 1 rep, 30 m dist, 2010 tempo, 0 second recovery
                      generateExerciseSet(2, opt2), // 1 rep, 30 m dist, 2010 tempo, 0 second recovery
                      generateExerciseSet(3, opt2), // 1 rep, 30 m dist, 2010 tempo, 0 second recovery
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1, opt1), // 12 reps, 20 kg, 60 second recovery
                      generateExerciseSet(2, opt1), // 12 reps, 20 kg, 60 second recovery
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
                      generateExerciseSet(1, opt1), // 12 reps, 20 kg, 60 second recovery
                      generateExerciseSet(2, opt1), // 12 reps, 20 kg, 60 second recovery
                      generateExerciseSet(3, opt1), // 12 reps, 20 kg, 60 second recovery
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
      db.components.clear(),
    ]);

    await app.close();
  });

  it('should return correct training stats', () => {
    const stats = trainingReportService.getTrainingStats(training);
    const totalTonnage = 10 * 12 * 20; // 2400 -> 8 sets of 12 reps with 20 kg
    const totalActiveTime = 10 * 12 * 3 + 3 * 30 * 1; // 450 + 90 = 540 -> 10 sets of 12 reps with 2010 (3 second) tempo, 3 sets of 30 m distance with 1 second per meter

    expect(stats).toEqual({
      totalDuration: 120,
      totalComponents: 2,
      totalSupersets: 3,
      totalExercises: 3, // unique
      totalSets: 11,
      totalReps: 10 * 12 + 3 * 1, // 99 -> (8 + 2 bilateral) sets of 12 reps, 3 sets of 1 rep (defaults to 1 rep if no `reps` specified)
      totalRecTime: 8 * 60, // 480 -> 8 sets with 60 sec recovery, 3 sets with 0 sec recovery (only effort based recovery)
      totalActiveTime,
      totalTonnage,
      totalTimeWork: 12 * 20 * 3 * 10, // 7200 -> 10 sets of 12 reps with 20 kg and 2010 (3 second) tempo
      totalDistWork: 0,
      totalPower: totalTonnage / totalActiveTime,
      totalRealizationScore: expect.any(Number),
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
    const report = await db.trainingReports.findById({
      trainingId: training.id,
      userId: global.athlete.uid,
    });

    expect(report).toBeDefined();
  });
});
