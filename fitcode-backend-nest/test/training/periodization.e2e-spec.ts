import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { deleteCollection, deleteDoc } from '@test/common/utils/data.util';
import { addDays, addMinutes } from 'date-fns';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { ParamType } from '@src/component/enum/param.enum';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { GroupService } from '@src/group/group.service';
import { generateCyclesStub } from '@src/group/mock/cycle.stub';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { InstitutionService } from '@src/institution/service/institution.service';
import type { Target } from '@src/target/entity/target.entity';
import { generateTargetStub } from '@src/target/mock/target.stub';
import { TestDbService } from '@src/test-db/test-db.service';
import type { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import type { Training } from '@src/training/entity/training.entity';
import { TrainingRepository } from '@src/training/repository/training.repository';

import type { TestTraining } from '../common/type/entity.type';

describe('Periodization functions (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let institutionService: InstitutionService;
  let trainingRepository: TrainingRepository;
  let groupService: GroupService;

  let institutionId: string;
  let groupId: string;
  let component: Component;
  let baseTraining: TestTraining;
  let exercises: Exercise[];

  let targetStrength: Target;
  let targetPower: Target;
  let targetPlyometric: Target;

  // set date to 21th july (Mon) of 2025 at 12:00 noon
  const baseFrom = new Date('2025-07-21T12:00:00Z');
  const baseTo = addMinutes(baseFrom, 30);

  const SUBGROUP_ID = 'subgroup';

  /* async function createBaseTraining(
    group: Group,
    options?: {
      numSubgroups?: number;
      arrgFrom?: Date;
      arrgTo?: Date;
    },
  ) {
    const { numSubgroups, arrgFrom, arrgTo } = options ? options : {};
    const from = arrgFrom || baseFrom;
    const to = arrgTo || baseTo;

    return await createTraining(firebase, {
      ownerId: global.trainer.uid,
      membersIds: group.membersIds,
      group,
      cycleId: group.cycles[0].id,
      from,
      to,
      components: [
        generateTrainingComponent({
          id: component.id,
          from: from,
          to: addMinutes(from, 1),
          target: targetPower,
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({
                  id: exercises[0].id,
                  sets: [
                    generateExerciseSet(1),
                    generateExerciseSet(2),
                    generateExerciseSet(3),
                  ],
                }),
                generateTrainingExercise({
                  id: exercises[1].id,
                  sets: [
                    generateExerciseSet(1),
                    generateExerciseSet(2),
                    generateExerciseSet(3),
                  ],
                }),
                generateTrainingExercise({
                  id: exercises[2].id,
                  sets: [
                    generateExerciseSet(1),
                    generateExerciseSet(2),
                    generateExerciseSet(3),
                  ],
                }),
              ],
            }),
          ],
          subgroups:
            numSubgroups > 0
              ? Array.from({ length: numSubgroups }, (_, i) =>
                  generateSubgroup({
                    id: `${SUBGROUP_ID}_${i + 1}`,
                    name: `Subgroup ${i + 1}`,
                    membersIds: group.membersIds.slice(0, 2),
                    supersets: [
                      generateSuperset({
                        exercises: [
                          generateTrainingExercise({
                            id: exercises[0].id,
                            sets: [
                              generateExerciseSet(1),
                              generateExerciseSet(2),
                              generateExerciseSet(3),
                            ],
                          }),
                          generateTrainingExercise({
                            id: exercises[1].id,
                            sets: [
                              generateExerciseSet(1),
                              generateExerciseSet(2),
                              generateExerciseSet(3),
                            ],
                          }),
                          generateTrainingExercise({
                            id: exercises[2].id,
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
                )
              : undefined,
        }),
      ],
    });
  } */

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    institutionService = moduleFixture.get(InstitutionService);
    trainingRepository = moduleFixture.get(TrainingRepository);
    groupService = moduleFixture.get(GroupService);

    [targetStrength, targetPower, targetPlyometric] = [
      generateTargetStub({
        id: 'strength',
        componentId: 'strength',
      }),
      generateTargetStub({ id: 'power', componentId: 'strength' }),
      generateTargetStub({
        id: 'plyometric',
        componentId: 'strength',
      }),
    ];

    institutionId = await db.institutions.addDoc(generateInstitutionStub());
    groupId = await db.groups.addDoc(
      generateGroupStub({ institutionId, cycles: generateCyclesStub(3) }),
    );

    component = await db.components.create(
      generateComponentStub({
        id: 'strength',
        targets: [targetStrength, targetPower, targetPlyometric],
      }),
    );

    exercises = await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ id: 'deadlift', componentIds: [component.id] }),
      generateExerciseStub({ id: 'squat', componentIds: [component.id] }),
      generateExerciseStub({ id: 'bench', componentIds: [component.id] }),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      deleteCollection(firebase, 'TRAINING'),
      deleteDoc(firebase, 'GROUP', groupId),
      deleteCollection(firebase, 'EXERCISE'),
      deleteDoc(firebase, 'INSTITUTION', institutionId),
      deleteDoc(firebase, 'COMPONENT', component.id),
    ]);

    await app.close();
  });

  function getOffsetTrainingByNDays(
    baseTraining: Training,
    numDays: number,
    target?: Target,
  ): Training {
    return {
      ...baseTraining,
      id: null,
      from: addDays(baseTraining.from, numDays),
      to: addDays(baseTraining.to, numDays),
      components: [
        {
          ...baseTraining.components[0],
          target,
          from: addDays(baseTraining.from, numDays),
          to: addDays(baseTraining.to, numDays),
        },
      ],
    };
  }

  it('should be defined', () => {
    expect(true).toBeTruthy();
  });

  /* describe('Periodization functions', () => {
    afterEach(async () => {
      await deleteCollection(firebase, 'TRAINING');
    });
    // dates: baseTraining(+0d), training1(+2d), training2(+4d), training3(+7d), training4(+14d),
    // differentTargetTraining(+21d), training5(+28d)

    // perscribed values can be set in generateExerciseSet functions on base training,
    // first value in expected is also the perscribed value, as the first training is the base training and it does not change,
    // except for types: block, wave
    // cannot test type autoregulatory, because it uses a random number
    // type dupTableBased is not supported yet

    it.each(PERIODIZATION_TEST_VALUES)(
      'should successfully use all the periodization functions for the trainings with the same target',
      async ({ type, expected }) => {
        baseTraining = await createBaseTraining(group, { numSubgroups: 3 });
        const differentTargetTraining = getOffsetTrainingByNDays(
          baseTraining,
          21,
          targetStrength,
        );

        await Promise.all(
          [
            getOffsetTrainingByNDays(baseTraining, 2, targetPower),
            getOffsetTrainingByNDays(baseTraining, 4, targetPower),
            getOffsetTrainingByNDays(baseTraining, 7, targetPower),
            getOffsetTrainingByNDays(baseTraining, 14, targetPower),
            getOffsetTrainingByNDays(baseTraining, 28, targetPower),
            differentTargetTraining,
          ].map((t) => createTraining(firebase, t)),
        );

        const foundTrainings = await trainingRepository.getDocs();
        expect(foundTrainings).toHaveLength(6 + 1); // 6 created + 1 base training

        const response = await request(app.getHttpServer())
          .post(`/training/periodize/trainings`)
          .set('Authorization', `Bearer ${global.trainer.token}`)
          .send({
            baseTrainingId: baseTraining.id,
            componentId: component.id,
            exerciseIds: exercises.map((e) => e.id),
            periodizationType: type,
          });

        expect(response.status).toBe(201);

        const periodizedTrainings = response.body;

        // base training + 5 periodized trainings, skips the training with different target
        expect(periodizedTrainings.length).toBe(6);

        for (const periodizedTraining of periodizedTrainings) {
          const trainingIndex = periodizedTrainings.indexOf(periodizedTraining);

          expect(periodizedTraining.components[0].id).toBe(component.id);

          // all subgroups should have the same values as in base training
          for (const sg of periodizedTraining.components[0].subgroups) {
            expect(sg.supersets.map((s) => s.exercises.map((e) => e))).toEqual(
              baseTraining.components[0].subgroups
                .find((subgroup) => subgroup.id === sg.id)
                ?.supersets.map((s) => s.exercises.map((e) => e)),
            );
          }

          for (const exercise of periodizedTraining.components[0].supersets[0]
            .exercises) {
            for (const set of exercise.sets) {
              const { int, vol } = getBaseIntVolValuesFromSet(set);
              expect(parseFloat(int.value)).toBe(expected[trainingIndex].int);
              expect(parseFloat(vol.value)).toBe(expected[trainingIndex].vol);
            }
          }
        }

        await deleteCollection(firebase, 'TRAINING');
      },
    );
  }); */

  /* describe('Subgroup periodization', () => {
    afterEach(async () => {
      await deleteCollection(firebase, 'TRAINING');
    });

    it('should return that it cannot periodize, because the base subgroup does not exist in future trainings', async () => {
      const trainings = [];
      for (let i = 0; i < 6; i++) {
        trainings.push(
          await createBaseTraining(group, {
            numSubgroups: i === 0 ? 1 : 0, // only first training has subgroup
            arrgFrom: addDays(baseFrom, i),
            arrgTo: addDays(baseTo, i),
          }),
        );
      }

      const response = await request(app.getHttpServer())
        .post(`/training/periodize/trainings`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          baseTrainingId: trainings[0].id,
          componentId: component.id,
          periodizationType: PeriodizationType.LINEAR,
          exerciseIds: exercises.map((e) => e.id),
          subgroupId: `${SUBGROUP_ID}_1`,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Selected subgroup not found in any future training`,
      );
    });

    it.each(PERIODIZATION_TEST_VALUES)(
      'should successfully periodize subgroup trainings and ignore main group and other subgroups',
      async ({ type, expected }) => {
        const SUBGROUP_1_ID = `${SUBGROUP_ID}_1`;

        baseTraining = await createBaseTraining(group, { numSubgroups: 3 });
        await Promise.all(
          [
            getOffsetTrainingByNDays(baseTraining, 2, targetPower),
            getOffsetTrainingByNDays(baseTraining, 4, targetPower),
            getOffsetTrainingByNDays(baseTraining, 7, targetPower),
            getOffsetTrainingByNDays(baseTraining, 14, targetPower),
            getOffsetTrainingByNDays(baseTraining, 28, targetPower),
          ].map((t) => createTraining(firebase, t)),
        );

        const foundTrainings = await trainingRepository.getDocs();
        expect(foundTrainings).toHaveLength(5 + 1); // 5 created + 1 base training

        const response = await request(app.getHttpServer())
          .post(`/training/periodize/trainings`)
          .set('Authorization', `Bearer ${global.trainer.token}`)
          .send({
            baseTrainingId: baseTraining.id,
            componentId: component.id,
            periodizationType: type,
            exerciseIds: exercises.map((e) => e.id),
            subgroupId: SUBGROUP_1_ID,
          });

        expect(response.status).toBe(201);

        const periodizedTrainings = response.body;

        expect(periodizedTrainings.length).toBe(6); // base training + 5 periodized trainings

        for (const periodizedTraining of periodizedTrainings) {
          const trainingIndex = periodizedTrainings.indexOf(periodizedTraining);

          expect(periodizedTraining.components[0].id).toBe(component.id);

          // main group has the same exercises as base training
          expect(
            periodizedTraining.components.map((c) =>
              c.supersets.map((s) => s.exercises.map((e) => e)),
            ),
          ).toEqual(
            baseTraining.components.map((c) =>
              c.supersets.map((s) => s.exercises.map((e) => e)),
            ),
          );

          // subgroups with different id have the same values as in base training
          periodizedTraining.components[0].subgroups.forEach((sg) => {
            expect(sg.id).toBe(`${SUBGROUP_ID}_${sg.id.split('_')[1]}`);
            if (sg.id === SUBGROUP_1_ID) return; // skip the subgroup we are periodizing
            expect(sg.supersets[0].exercises.map((e) => e)).toEqual(
              baseTraining.components[0].subgroups
                .find((subgroup) => subgroup.id === sg.id)
                ?.supersets[0].exercises.map((e) => e),
            );
          });

          const subgroup = periodizedTraining.components[0].subgroups.find(
            (sg) => sg.id === SUBGROUP_1_ID,
          );
          if (!subgroup)
            throw new Error(`Subgroup ${SUBGROUP_1_ID} not found in training`);

          for (const exercise of subgroup.supersets[0].exercises) {
            for (const set of exercise.sets) {
              const { int, vol } = getBaseIntVolValuesFromSet(set);
              expect(parseFloat(int.value)).toBe(expected[trainingIndex].int);
              expect(parseFloat(vol.value)).toBe(expected[trainingIndex].vol);
            }
          }
        }

        await deleteCollection(firebase, 'TRAINING');
      },
    );
  }); */
});

function getBaseIntVolValuesFromSet(set: ExerciseSet) {
  const int = set.paramValuesL.find((p) => p.field === ParamType.IntWork1);
  const vol = set.paramValuesL.find((p) => p.field === ParamType.VolWork1);
  return { int, vol };
}
