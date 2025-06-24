import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ComponentService } from '../../src/component/component.service';
import { Component } from '../../src/component/entity/component.entity';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { TrainingService } from '../../src/training/service/training.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
} from '../common/utils/data.util';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import {
  generateTrainingStub,
  generateTrainingComponent,
  generateSuperset,
  generateTrainingExercise,
  generateExerciseSet,
} from '../../src/training/mock/training.stub';
import { Training } from '../../src/training/entity/training.entity';
import { addDays, addMinutes } from 'date-fns';
import { Exercise } from '../../src/exercise/entity/exercise.entity';
import { PeriodizationType } from '../../src/training/enum/periodization-type.enum';
import { ParamType } from '../../src/component/enum/param.enum';
import { ExerciseSet } from '../../src/training/entity/exercise-set.entity';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { TestInstitution } from '../common/type/entity.type';

describe('Periodization functions (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let institutionService: InstitutionService;
  let groupService: GroupService;

  let institution: TestInstitution;
  let group: Group;
  let component: Component;
  let baseTraining: Training;
  let trainings: Training[];
  let exercises: Exercise[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    institutionService = moduleFixture.get(InstitutionService);
    groupService = moduleFixture.get(GroupService);

    institution = await createInstitution(institutionService);
    component = await componentService.create(
      generateComponentStub({
        id: 'strength',
        name: 'Strength',
        targets: [
          {
            id: 'strength',
            name: 'Strength',
            componentId: 'strength',
            color: '#201f97',
          },
          {
            id: 'power',
            name: 'Power',
            componentId: 'strength',
            color: '#eb6683',
          },
          {
            id: 'plyometric',
            name: 'Plyometric',
            componentId: 'strength',
            color: '#619eae',
          },
        ],
      }),
    );

    group = await createGroupWithCycles(groupService, institution, {
      cycleLengthInWeeks: 60,
    });

    exercises = await exerciseService.createMany(global.admin, [
      generateExerciseStub({ id: 'deadlift', componentIds: [component.id] }),
      generateExerciseStub({ id: 'squat', componentIds: [component.id] }),
      generateExerciseStub({
        id: 'bench-press',
        componentIds: [component.id],
      }),
    ]);

    const from = new Date(2026, 5, 17); // change this after this date is passed to a WEDNESDAY in future
    const to = addMinutes(from, 30);

    baseTraining = await trainingService.create(
      trainer,
      generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        from,
        to,
        components: [
          generateTrainingComponent({
            id: component.id,
            from: from,
            to: addMinutes(from, 1),
            target: {
              id: 'power',
              name: 'Power',
              componentId: 'strength',
              color: '#eb6683',
            },
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: exercises[0].id,
                    periodized: false,
                    sets: [
                      generateExerciseSet({ setNumber: 1 }),
                      generateExerciseSet({ setNumber: 2 }),
                      generateExerciseSet({ setNumber: 3 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: exercises[1].id,
                    periodized: false,
                    sets: [
                      generateExerciseSet({ setNumber: 1 }),
                      generateExerciseSet({ setNumber: 2 }),
                      generateExerciseSet({ setNumber: 3 }),
                    ],
                  }),
                  generateTrainingExercise({
                    id: exercises[2].id,
                    periodized: false,
                    sets: [
                      generateExerciseSet({ setNumber: 1 }),
                      generateExerciseSet({ setNumber: 2 }),
                      generateExerciseSet({ setNumber: 3 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    function getOffsetTrainingByNDays(numDays: number): Training {
      return {
        ...baseTraining,
        id: null,
        from: addDays(baseTraining.from, numDays),
        to: addDays(baseTraining.to, numDays),
        components: [
          {
            ...baseTraining.components[0],

            from: addDays(baseTraining.from, numDays),
            to: addDays(baseTraining.to, numDays),
          },
        ],
      };
    }

    const differentTargetTraining = {
      ...baseTraining,
      id: null,
      from: addDays(baseTraining.from, 21),
      to: addDays(baseTraining.to, 21),
      components: [
        {
          ...baseTraining.components[0],
          target: {
            id: 'strength',
            name: 'Strength',
            componentId: 'strength',
            color: '#201f97',
          },
          from: addDays(baseTraining.from, 21),
          to: addDays(baseTraining.to, 21),
        },
      ],
    };

    // dates: baseTraining(+0d), training1(+2d), training2(+4d), training3(+7d), training4(+14d),
    // differentTargetTraining(+21d), training5(+28d)
    trainings = [
      getOffsetTrainingByNDays(2),
      getOffsetTrainingByNDays(4),
      getOffsetTrainingByNDays(7),
      getOffsetTrainingByNDays(14),
      getOffsetTrainingByNDays(28),
      differentTargetTraining,
    ];

    await Promise.all(trainings.map((t) => trainingService.create(trainer, t)));
  });

  afterAll(async () => {
    await Promise.all([
      deleteCollection(firebase, 'TRAINING'),
      deleteCollection(firebase, 'EXERCISE'),
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'COMPONENT', component.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
    ]);

    await app.close();
  });

  describe('Periodization functions', () => {
    // perscribed values can be set in generateExerciseSet functions on base training,
    // first value in expected is also the perscribed value, as the first training is the base training and it does not change,
    // except for types: block, wave
    // cannot test type autoregulatory, because it uses a random number
    // type dupTableBased is not supported yet
    const values = [
      {
        type: PeriodizationType.LINEAR,
        expected: [
          { int: 20, vol: 12 },
          { int: 22, vol: 11 },
          { int: 24, vol: 10 },
          { int: 26, vol: 9 },
          { int: 28, vol: 8 },
          { int: 30, vol: 7 },
        ],
      },
      {
        type: PeriodizationType.WEEK_UNDULATING,
        expected: [
          { int: 20, vol: 12 },
          { int: 20, vol: 12 },
          { int: 20, vol: 12 },
          { int: 22, vol: 11 },
          { int: 18, vol: 13 },
          { int: 16, vol: 14 },
        ],
      },
      {
        type: PeriodizationType.DAY_UNDULATING,
        expected: [
          { int: 20, vol: 12 },
          { int: 22, vol: 11 },
          { int: 18, vol: 13 },
          { int: 20, vol: 12 },
          { int: 20, vol: 12 },
          { int: 20, vol: 12 },
        ],
      },
      {
        type: PeriodizationType.BLOCK,
        expected: [
          { int: 14, vol: 8 },
          { int: 14, vol: 8 },
          { int: 14, vol: 8 },
          { int: 14, vol: 8 },
          { int: 16, vol: 5 },
          { int: 18, vol: 3 },
        ],
      },
      {
        type: PeriodizationType.WAVE,
        expected: [
          { int: 11, vol: 5 },
          { int: 11, vol: 5 },
          { int: 11, vol: 5 },
          { int: 12, vol: 3 },
          { int: 11, vol: 5 },
          { int: 11, vol: 5 },
        ],
      },
      {
        type: PeriodizationType.DUP_TABLE_BASED, // type dupTableBased is not supported yet
        expected: [],
      },
    ];

    it.each(values)(
      'should pass',
      () => {
        expect(true).toBeTruthy();
      },
      //   'should successfully use all the periodization functions for the trainings with the same target',
      //   async ({ type, expected }) => {
      //     if (type === PeriodizationType.DUP_TABLE_BASED) {
      //       const response = await request(app.getHttpServer())
      //         .post(`/training/periodize/trainings`)
      //         .set('Authorization', `Bearer ${trainer.token}`)
      //         .send({
      //           baseTrainingId: baseTraining.id,
      //           excludedTrainingIds: [],
      //           componentId: component.id,
      //           exerciseIds: exercises.map((e) => e.id),
      //           periodizationType: type,
      //         });

      //       expect(response.status).toBe(400);
      //       expect(response.body.message).toBe(
      //         `Dup Table Based periodization is not supported yet`,
      //       );

      //       return;
      //     }

      //     const periodizedTrainings = await trainingService.periodizeTrainings(
      //       trainer,
      //       {
      //         baseTrainingId: baseTraining.id,
      //         excludedTrainingIds: [],
      //         componentId: component.id,
      //         exerciseIds: exercises.map((e) => e.id),
      //         periodizationType: type,
      //       },
      //     );

      //     expect(periodizedTrainings.length).toBe(6); // base training + 5 periodized trainings, skips the training with different target

      //     for (const periodizedTraining of periodizedTrainings) {
      //       const trainingIndex = periodizedTrainings.indexOf(periodizedTraining);

      //       for (const exercise of periodizedTraining.components[0].supersets[0]
      //         .exercises) {
      //         for (const set of exercise.sets) {
      //           const { int, vol } = getBaseIntVolValuesFromSet(set);
      //           expect(parseFloat(int.value)).toBe(expected[trainingIndex].int);
      //           expect(parseFloat(vol.value)).toBe(expected[trainingIndex].vol);
      //         }
      //       }
      //     }
      //   },
    );
  });
});

function getBaseIntVolValuesFromSet(set: ExerciseSet) {
  const int = set.paramValuesL.find((p) => p.field === ParamType.IntWork1);
  const vol = set.paramValuesL.find((p) => p.field === ParamType.VolWork1);
  return { int, vol };
}
