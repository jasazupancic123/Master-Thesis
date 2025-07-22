import { type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  COMPONENT_PARAMS_OPT1,
  COMPONENT_PARAMS_OPT2,
} from '@test/common/constant/component-params.constant';
import { TestDbService } from '@src/test-db/test-db.service';
import { addDays, subDays } from 'date-fns';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import type { Component } from '@src/component/entity/component.entity';
import { ParamType } from '@src/component/enum/param.enum';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { generateComponentParamsStub } from '@src/component/mock/component-param.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import type { Training } from '@src/training/entity/training.entity';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import {
  generateWorkloadMetaStub,
  generateWorkloadStub,
} from '@src/training/mock/workload.stub';
import { TrainingService } from '@src/training/service/training.service';

import type { TestInstitution } from '../common/type/entity.type';
import { createAthleteUserAndToken } from '@test/common/utils/auth.util';
import {
  createGroupWithCycles,
  createInstitution,
  createInstitutionWithUsers,
  deleteDoc,
  deleteDocs,
  deleteInstitution,
  deleteUsers,
} from '@test/common/utils/data.util';
import { getTime } from '@src/common/utils/date.util';

describe('Update Training (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let firebase: FirebaseService;
  let componentService: ComponentService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let institutionService: InstitutionService;

  let component1: Component;
  let component2: Component;

  // first institution
  let institution: TestInstitution;
  let group: Group;
  let training: Training;

  // other institution
  let otherInstitution: TestInstitution;
  let otherGroup: Group;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    component1 = await componentService.create(
      generateComponentStub({
        params: { [DEFAULT_PARAMS_KEY]: COMPONENT_PARAMS_OPT1 },
      }),
    );

    component2 = await componentService.create(
      generateComponentStub({
        params: { [DEFAULT_PARAMS_KEY]: COMPONENT_PARAMS_OPT2 },
      }),
    );

    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);
    training = await createTraining();

    otherInstitution = await createInstitutionWithUsers(
      firebase,
      institutionService,
    );

    otherGroup = await createGroupWithCycles(groupService, otherInstitution);
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'TRAINING', training.id),
      deleteDocs(firebase, 'GROUP', [otherGroup.id, group.id]),
      deleteInstitution(firebase, institution),
      deleteInstitution(firebase, otherInstitution),
      deleteDoc(firebase, 'COMPONENT', component1.id),
      deleteDoc(firebase, 'COMPONENT', component2.id),
    ]);

    await app.close();
  });

  async function createTraining(data?: Partial<Training>) {
    return await db.trainings.create({
      ownerId: global.trainer.uid,
      membersIds: [global.athlete.uid],
      institutionId: institution.id,
      groupId: group.id,
      cycleId: group.cycles[1].id,
      components: [generateTrainingComponent({ id: component1.id })],
      date: data?.from,
      ...data,
    });
  }

  describe('Update training', () => {
    it('should fail to update training if training id not found', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/invalid-id`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Training not found`);
    });

    it('should fail to update training if users from same institution without permission try to edit it', async () => {
      const responses = await Promise.all(
        [global.athlete].map((user) =>
          request(app.getHttpServer())
            .patch(`/training/${training.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send(training),
        ),
      );

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(`You cannot edit this training`);
      }
    });

    it('should fail to update training if users from other institution try to edit it', async () => {
      const responses = await Promise.all(
        [
          otherInstitution.athletes[0],
          otherInstitution.trainers[0],
          otherInstitution.manager,
        ].map((user) =>
          request(app.getHttpServer())
            .patch(`/training/${training.id}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send(training),
        ),
      );

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body.message).toBe(`You cannot view this training`);
      }
    });

    it('should fail to update training if training is not in cycle', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          components: [
            generateTrainingComponent({
              id: component1.id,
              from: getTime(addDays(new Date(), 100), 8, 0),
              to: getTime(addDays(new Date(), 100), 8, 30),
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training falls outside of the selected cycle',
      );
    });

    it('should fail to update training if training is in the past', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          components: [
            generateTrainingComponent({
              id: component1.id,
              from: getTime(subDays(new Date(), 2), 8, 0),
              to: getTime(subDays(new Date(), 2), 8, 30),
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training falls outside of the selected cycle',
      );
    });

    it('should delete training if there are not any components left', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({ ...training, components: [] });

      const trainings = await trainingService.findAll(global.trainer);
      expect(response.status).toBe(200);
      expect(trainings).toHaveLength(0);

      await deleteDoc(firebase, 'TRAINING', training.id);
      training = await createTraining();
    });

    it('should fail to update training if there is overlap between trainings', async () => {
      const prevTraining = await createTraining({
        from: getTime(addDays(new Date(), 2), 9, 30),
      });

      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          components: [
            generateTrainingComponent({
              id: component1.id,
              from: getTime(addDays(new Date(), 2), 10, 0),
              to: getTime(addDays(new Date(), 2), 10, 30),
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training overlaps with other training',
      );

      await deleteDocs(firebase, 'TRAINING', [prevTraining.id, training.id]);
      training = await createTraining();
    });

    it('should fail to update training if training is in institution and trainer / manager wants to add members outside the institution', async () => {
      const newAthlete = await createAthleteUserAndToken(firebase);
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({ ...training, membersIds: [newAthlete.uid] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `User ${newAthlete.displayName || newAthlete.email} is not part of institution`,
      );

      await Promise.all([
        deleteUsers(firebase, [newAthlete]),
        deleteDoc(firebase, 'TRAINING', training.id),
      ]);

      training = await createTraining();
    });
  });

  describe('Copy training', () => {
    it('should fail to copy training if group not found', async () => {
      const data = generateTrainingStub({
        ...training,
        groupId: 'invalid-group-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(data);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });
  });

  describe('Delete training', () => {
    it('should fail to delete training if group not found', async () => {
      const data = generateTrainingStub({
        ...training,
        groupId: 'invalid-group-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send(data);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });
  });

  describe('Custom workloads', () => {
    let exercise1: Exercise;
    let exercise2: Exercise;

    beforeAll(async () => {
      exercise1 = await db.exercises.create({
        ownerId: global.trainer.uid,
        componentIds: [component1.id],
      });

      exercise2 = await db.exercises.create({
        ownerId: global.trainer.uid,
        componentIds: [component2.id],
      });

      await db.trainings.delete(training.id);

      training = await createTraining({
        components: [
          generateTrainingComponent({
            id: component1.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: exercise1.id,
                    sets: [
                      generateExerciseSet(1, COMPONENT_PARAMS_OPT1),
                      generateExerciseSet(2, COMPONENT_PARAMS_OPT1),
                      generateExerciseSet(3, COMPONENT_PARAMS_OPT1),
                    ],
                  }),
                ],
              }),
            ],
          }),
          generateTrainingComponent({
            id: component2.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: exercise2.id,
                    sets: [
                      generateExerciseSet(1, COMPONENT_PARAMS_OPT2),
                      generateExerciseSet(2, COMPONENT_PARAMS_OPT2),
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
      await Promise.all([
        db.exercises.delete(exercise1.id),
        db.exercises.delete(exercise2.id),
      ]);
    });

    it('should fail if training component is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadMetaStub({ componentId: 'invalid-component-id' }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Invalid component provided in workload',
      );
    });

    it('should fail if exercise does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadMetaStub({
              componentId: component1.id,
              exerciseId: 'invalid-exercise-id',
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Exercise does not exist`);
    });

    it('should fail if exercise not prescribed in superset', async () => {
      const otherExercise = await db.exercises.create({
        name: 'Other Exercise',
        ownerId: global.trainer.uid,
        componentIds: [component1.id],
      });

      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadMetaStub({
              componentId: component1.id,
              exerciseId: otherExercise.id,
              supersetIndex: 0,
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Exercise ${otherExercise.name} is not prescribed in superset 1`,
      );

      await db.exercises.delete(otherExercise.id);
    });

    it('should fail if invalid set number is provided', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadMetaStub({
              componentId: component1.id,
              exerciseId: exercise1.id,
              supersetIndex: 0,
              setNumber: 5, // Invalid set number
            }),
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Set number 5 is invalid for exercise ${exercise1.name}`,
      );
    });

    it.each([
      [
        generateComponentParamsStub([]),
        { invalidParamText: 'You have to complete parameter volume (reps)' },
      ],
      [
        generateComponentParamsStub([ParamType.VolWork1]),
        {
          invalidParamText:
            'You have to complete parameter intensity (kilograms)',
        },
      ],
      [
        generateComponentParamsStub([
          ParamType.VolWork1,
          ParamType.IntWork1,
          ParamType.VolWork2,
        ]),
        { invalidParamText: 'Parameter volume is not prescribed' },
      ],
    ])(
      'should fail if there are missing parameters in custom workload',
      async (componentParams, { invalidParamText }) => {
        const response = await request(app.getHttpServer())
          .patch(`/training/${training.id}`)
          .set('Authorization', `Bearer ${global.trainer.token}`)
          .send({
            ...training,
            workloads: [
              generateWorkloadStub(component1, {
                exerciseId: exercise1.id,
                supersetIndex: 0,
                setNumber: 1,
                customComponentParams: componentParams,
              }),
            ],
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          `${invalidParamText} in exercise ${exercise1.name} in superset 1`,
        );
      },
    );

    it('should fail if prescribed param has no value or has negative value', async () => {
      const workload = generateWorkloadStub(component1, {
        exerciseId: exercise1.id,
        supersetIndex: 0,
        setNumber: 1,
        customComponentParams: generateComponentParamsStub([
          ParamType.VolWork1,
          ParamType.IntWork1,
        ]),
      });

      workload.prescribedVolWork1ValueL = undefined; // No value
      let response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({ ...training, workloads: [workload] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Prescribed volume value must not be empty`,
      );

      workload.prescribedVolWork1ValueL = -5; // Negative value
      response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({ ...training, workloads: [workload] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Prescribed volume value must not be empty`,
      );
    });

    it('should update training with custom workloads', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadStub(component1, {
              exerciseId: exercise1.id,
              supersetIndex: 0,
              setNumber: 1,
              randomValues: true,
              customComponentParams: generateComponentParamsStub([
                ParamType.VolWork1,
                ParamType.IntWork1,
              ]),
            }),
          ],
        });

      expect(response.status).toBe(200);

      const workloads = await db.workloads.getAll(training.id);
      expect(workloads).toHaveLength(1);
      expect(workloads[0].componentId).toBe(component1.id);
      expect(workloads[0].exerciseId).toBe(exercise1.id);
      expect(workloads[0].supersetIndex).toBe(0);
      expect(workloads[0].setNumber).toBe(1);

      // prescribed values that should be defined
      expect(workloads[0].volWork1Type).toBeDefined();
      expect(workloads[0].prescribedVolWork1ValueL).toBeDefined();
      expect(workloads[0].prescribedVolWork1ValueR).toBeDefined();

      expect(workloads[0].intWork1Type).toBeDefined();
      expect(workloads[0].prescribedIntWork1ValueL).toBeDefined();
      expect(workloads[0].prescribedIntWork1ValueR).toBeDefined();

      // other prescribed values should be undefined
      expect(workloads[0].volWork2Type).toBeUndefined();
      expect(workloads[0].prescribedVolWork2ValueL).toBeUndefined();
      expect(workloads[0].prescribedVolWork2ValueR).toBeUndefined();

      expect(workloads[0].intWork2Type).toBeUndefined();
      expect(workloads[0].prescribedIntWork2ValueL).toBeUndefined();
      expect(workloads[0].prescribedIntWork2ValueR).toBeUndefined();

      expect(workloads[0].volRecType).toBeUndefined();
      expect(workloads[0].prescribedVolRecValueL).toBeUndefined();
      expect(workloads[0].prescribedVolRecValueR).toBeUndefined();

      expect(workloads[0].intRecType).toBeUndefined();
      expect(workloads[0].prescribedIntRecValueL).toBeUndefined();
      expect(workloads[0].prescribedIntRecValueR).toBeUndefined();

      await db.workloads.deleteAll(training.id);
    });

    it('should update training with multiple custom workloads', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [
            generateWorkloadStub(component1, {
              userId: global.athlete.uid,
              exerciseId: exercise1.id,
              supersetIndex: 0,
              setNumber: 1,
              randomValues: true,
            }),
            generateWorkloadStub(component1, {
              userId: global.athlete.uid,
              exerciseId: exercise1.id,
              supersetIndex: 0,
              setNumber: 2,
              randomValues: true,
            }),
            generateWorkloadStub(component1, {
              userId: global.athlete.uid,
              exerciseId: exercise1.id,
              supersetIndex: 0,
              setNumber: 3,
              randomValues: true,
            }),
            generateWorkloadStub(component2, {
              exerciseId: exercise2.id,
              supersetIndex: 0,
              setNumber: 1,
              randomValues: true,
            }),
            generateWorkloadStub(component2, {
              exerciseId: exercise2.id,
              supersetIndex: 0,
              setNumber: 2,
              randomValues: true,
            }),
          ],
        });

      expect(response.status).toBe(200);

      const workloads = await db.workloads.getAll(training.id);
      expect(workloads).toHaveLength(5);

      await db.workloads.deleteAll(training.id);
    });

    it('should update workload if one already exists', async () => {
      await db.workloads.createManyCompleted([
        {
          trainingId: training.id,
          component: component1,
          exerciseId: exercise1.id,
          userId: global.athlete.uid,
          supersetIndex: 0,
          setNumber: 1,
          randomValues: false,
        },
      ]);

      const existingWorkloads = await db.workloads.getAll(training.id);

      expect(existingWorkloads).toHaveLength(1);
      const existingWorkload = existingWorkloads[0];
      expect(existingWorkload.prescribedIntWork1ValueL).toBe(20); //INT_OPTIONS[0].defaultValue,

      const newWorkload = generateWorkloadStub(component1, {
        trainingId: training.id,
        exerciseId: exercise1.id,
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 1,
      });

      newWorkload.prescribedIntWork1ValueL = 22;

      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads: [newWorkload], // this should update the existing workload
        });

      expect(response.status).toBe(200);

      const updatedWorkloads = await db.workloads.getAll(training.id);

      expect(updatedWorkloads).toHaveLength(1);

      const updatedWorkload = updatedWorkloads[0];
      expect(updatedWorkload.id).toBe(existingWorkload.id);
      expect(updatedWorkload.componentId).toBe(component1.id);
      expect(updatedWorkload.exerciseId).toBe(exercise1.id);
      expect(updatedWorkload.supersetIndex).toBe(0);
      expect(updatedWorkload.setNumber).toBe(1);
      expect(updatedWorkload.prescribedIntWork1ValueL).toBe(22);

      await db.workloads.deleteAll(training.id);
    });

    it('should update multiple workloads if some already exist', async () => {
      await db.workloads.createManyCompleted([
        {
          trainingId: training.id,
          component: component1,
          exerciseId: exercise1.id,
          userId: global.athlete.uid,
          supersetIndex: 0,
          setNumber: 1,
        },
        {
          trainingId: training.id,
          component: component1,
          exerciseId: exercise1.id,
          userId: global.athlete.uid,
          supersetIndex: 0,
          setNumber: 2,
        },
        {
          trainingId: training.id,
          component: component2,
          exerciseId: exercise2.id,
          userId: global.athlete.uid,
          supersetIndex: 0,
          setNumber: 1,
        },
      ]);

      const existingWorkloads = await db.workloads.getAll(training.id);

      expect(existingWorkloads).toHaveLength(3);

      // change the first workload and add new ones
      const newWorkload1 = await db.workloads.update({
        ...generateWorkloadStub(component1, {
          trainingId: training.id,
          exerciseId: exercise1.id,
          userId: global.athlete.uid,
          supersetIndex: 0,
          setNumber: 1,
        }),
        prescribedIntWork1ValueL: 25,
      });

      expect(newWorkload1.prescribedIntWork1ValueL).toBe(25);

      // add remaining workloads
      const workloads = [
        generateWorkloadStub(component1, {
          userId: global.athlete.uid,
          exerciseId: exercise1.id,
          supersetIndex: 0,
          setNumber: 2,
        }),
        generateWorkloadStub(component1, {
          userId: global.athlete.uid,
          exerciseId: exercise1.id,
          supersetIndex: 0,
          setNumber: 3,
        }),
        generateWorkloadStub(component2, {
          exerciseId: exercise2.id,
          supersetIndex: 0,
          setNumber: 2,
        }),
      ];

      const response = await request(app.getHttpServer())
        .patch(`/training/${training.id}`)
        .set('Authorization', `Bearer ${global.trainer.token}`)
        .send({
          ...training,
          workloads,
        });

      expect(response.status).toBe(200);

      const updatedWorkloads = await db.workloads.getAll(training.id);

      expect(updatedWorkloads).toHaveLength(5);

      const updatedWorkload1 = updatedWorkloads.find(
        (w) => w.setNumber === 1 && w.exerciseId === exercise1.id,
      );

      expect(updatedWorkload1).toBeDefined();
      expect(updatedWorkload1.id).toBe(newWorkload1.id);
      expect(updatedWorkload1.prescribedIntWork1ValueL).toBe(25);

      const otherWorkloads = updatedWorkloads.filter(
        (w) => w.setNumber !== 1 || w.exerciseId !== exercise1.id,
      );

      expect(otherWorkloads).toHaveLength(4);
      for (const workload of otherWorkloads)
        expect(workload.prescribedIntWork1ValueL).not.toBe(25);

      await db.workloads.deleteAll(training.id);
    });
  });
});
