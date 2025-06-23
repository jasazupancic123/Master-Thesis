import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { ComponentService } from '../../src/component/component.service';
import { Component } from '../../src/component/entity/component.entity';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { TrainingService } from '../../src/training/service/training.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import { addDays, addHours, subDays, subHours } from 'date-fns';
import {
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
  deleteDocs,
  deleteUsers,
  getTime,
} from '../common/utils/data.util';
import {
  DEFAULT_PARAMS_KEY,
  PARAMS,
  VOL_OPTIONS,
} from '../../src/component/constant/param.constant';
import { ParamType, VolType } from '../../src/component/enum/param.enum';
import { TrainingComponent } from '../../src/training/entity/training-component.entity';
import { WorkloadService } from '../../src/training/service/workload.service';
import { SetStatus } from '../../src/training/enum/set-status.enum';
import { Workload } from '../../src/training/entity/workload.entity';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { Institution } from '../../src/institution/entity/institution.entity';
import {
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from '../common/utils/auth.util';

describe('Create Training (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let workloadService: WorkloadService;
  let institutionService: InstitutionService;

  let institution: Institution;
  let group: Group;
  let component: Component;

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
    groupService = moduleFixture.get(GroupService);
    workloadService = moduleFixture.get(WorkloadService);
    institutionService = moduleFixture.get(InstitutionService);

    component = await componentService.create(generateComponentStub());
    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, {
      institutionId: institution.id,
    });
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'COMPONENT', component.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteDoc(firebase, 'GROUP', group.id),
    ]);

    await app.close();
  });

  describe('Create training', () => {
    it('should fail to create new training if group provided and not found', async () => {
      const training = generateTrainingStub({ groupId: 'invalid-group-id' });
      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Group does not exist`);
    });

    it('should fail to create new training if group and cycle provided and cycle not found', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: 'invalid-cycle-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Cycle does not exist`);
    });

    it('should fail to create new training if cycle not found', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: 'invalid-cycle-id',
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Cycle does not exist`);
    });

    it('should fail to create new training if training does not have atleast one component', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training must have atleast one component',
      );
    });

    it('should fail to create new training if user is not owner (trainer) of the group or manager of institution', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        components: [generateTrainingComponent()],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${athlete.token}`)
        .send(training);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You cannot add training');
    });

    it('should fail to create new training if training falls outside of the cycle date range', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        components: [
          generateTrainingComponent({
            from: addDays(new Date(), 100),
            to: addDays(new Date(), 101),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Training falls outside of the selected cycle',
      );
    });

    it('should fail to create new training if training is in the past', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[0].id,
        components: [
          generateTrainingComponent({
            from: subDays(new Date(), 2),
            to: subDays(new Date(), 2),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot add or update trainings in the past',
      );
    });

    it('should fail to create new training if it exceeds daily training limit', async () => {
      const from = getTime(addDays(new Date(), 2), 8, 0);
      const trainings = [
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: component.id,
              from: addHours(from, 0),
              to: addHours(from, 1),
            }),
          ],
        }),
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [generateTrainingComponent({ id: component.id })],
          from: addHours(from, 1),
          to: addHours(from, 2),
        }),
      ];

      const trainingIds = (
        await Promise.all(
          trainings.map((t) => trainingService.create(trainer, t)),
        )
      ).map((t) => t.id);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            from: addHours(from, 2),
            to: addHours(from, 3),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Maximum number of trainings per day reached',
      );

      await deleteDocs(firebase, 'TRAINING', trainingIds);
    });

    it.each([
      getTime(addDays(new Date(), 2), 8, 0),
      getTime(addDays(new Date(), 2), 12, 0),
      getTime(addDays(new Date(), 2), 18, 0),
    ])(
      'should fail to create new training there is an overlap with other trainings',
      async (from) => {
        const trainingId = (
          await trainingService.create(
            trainer,
            generateTrainingStub({
              groupId: group.id,
              cycleId: group.cycles[1].id,
              components: [
                generateTrainingComponent({
                  id: component.id,
                  from,
                  to: addHours(from, 1),
                }),
              ],
            }),
          )
        ).id;

        const training = generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: component.id,
              from: subHours(from, 1),
              to: addHours(from, 2),
            }),
          ],
        });

        const response = await request(app.getHttpServer())
          .post('/training')
          .set('Authorization', `Bearer ${trainer.token}`)
          .send(training);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          'Training overlaps with other training',
        );

        await deleteDoc(firebase, 'TRAINING', trainingId);
      },
    );

    it('should fail to create new training if training has invalid training component', async () => {
      const from = getTime(addDays(new Date(), 2), 8, 0);
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: 'invalid-component-id',
            from,
            to: addHours(from, 1),
          }),
          generateTrainingComponent({
            id: component.id,
            from: addHours(from, 1),
            to: addHours(from, 2),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Component does not exist');
    });

    it('should fail to create new training if training has more components than the limit', async () => {
      const components = await Promise.all([
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            from: getTime(addDays(new Date(), 2), 8, 0),
            to: getTime(addDays(new Date(), 2), 8, 30),
          }),
          generateTrainingComponent({
            id: components[0].id,
            from: getTime(addDays(new Date(), 2), 8, 30),
            to: getTime(addDays(new Date(), 2), 9, 0),
          }),
          generateTrainingComponent({
            id: components[1].id,
            from: getTime(addDays(new Date(), 2), 9, 0),
            to: getTime(addDays(new Date(), 2), 9, 30),
          }),
          generateTrainingComponent({
            id: components[2].id,
            from: getTime(addDays(new Date(), 2), 9, 30),
            to: getTime(addDays(new Date(), 2), 10, 0),
          }),
          generateTrainingComponent({
            id: components[3].id,
            from: getTime(addDays(new Date(), 2), 10, 0),
            to: getTime(addDays(new Date(), 2), 10, 30),
          }),
          generateTrainingComponent({
            id: components[4].id,
            from: getTime(addDays(new Date(), 2), 10, 30),
            to: getTime(addDays(new Date(), 2), 11, 0),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'You can only have up to 5 components per training',
      );

      await deleteDocs(
        firebase,
        'COMPONENT',
        components.map((c) => c.id),
      );
    });

    it('should fail to create new training if component is not root', async () => {
      const leaf = await componentService.create(
        generateComponentStub({ parentId: component.id }),
      );

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [generateTrainingComponent({ id: leaf.id })],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Component ${leaf.name} cannot be selected for training`,
      );

      await deleteDocs(firebase, 'COMPONENT', [component.id, leaf.id]);
      component = await componentService.create(generateComponentStub());
    });

    it('should fail to create new training if it contains duplicate components', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            from: getTime(addDays(new Date(), 2), 8, 0),
            to: getTime(addDays(new Date(), 2), 8, 30),
          }),
          generateTrainingComponent({
            id: component.id,
            from: getTime(addDays(new Date(), 2), 9, 0),
            to: getTime(addDays(new Date(), 2), 9, 30),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Duplicate component ${component.name}`,
      );
    });

    it('should fail to create new training if training components times are not valid', async () => {
      const components = await Promise.all([
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
        componentService.create(generateComponentStub()),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: components[0].id,
            from: getTime(addDays(new Date(), 7), 8, 0),
          }),
          generateTrainingComponent({
            id: components[1].id,
            from: getTime(addDays(new Date(), 7), 7, 0),
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Component ${components[0].name} has to start before ${components[1].name}`,
      );

      await deleteDocs(
        firebase,
        'COMPONENT',
        components.map((c) => c.id),
      );
    });

    it('should fail to create new training if max number of supersets is reached', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
              generateSuperset(),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'You can only have up to 8 supersets per training component',
      );
    });

    it('should fail to create new training if max number of training exercises per superset is reached', async () => {
      const component = await componentService.create(generateComponentStub());
      const exercises = await exerciseService.createMany(global.manager, [
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                  generateTrainingExercise({ id: exercises[2].id }),
                  generateTrainingExercise({ id: exercises[3].id }),
                  generateTrainingExercise({ id: exercises[4].id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'You can only have up to 4 exercises per superset',
      );

      await Promise.all([
        deleteDoc(firebase, 'COMPONENT', component.id),
        deleteDocs(
          firebase,
          'EXERCISE',
          exercises.map((e) => e.id),
        ),
      ]);
    });

    it('should fail to create new training if user is in multiple subgroups', async () => {
      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [generateSuperset()],
            subgroups: [
              generateSubgroup({ membersIds: [athlete.uid] }),
              generateSubgroup({ membersIds: [athlete.uid] }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        `Member cannot be part of multiple subgroups simultaneously`,
      );
    });

    // NOTE (stale test) - all exercises can be passed to all components
    /* it('should fail to create new training if exercises are invalid', async () => {
      const component1 = await componentService.create(generateComponentStub());
      const component2 = await componentService.create(generateComponentStub());

      const exercises = await exerciseService.createMany(global.manager, [
        generateExerciseStub({ componentIds: [component1.id] }),
        generateExerciseStub({ componentIds: [component2.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component1.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `Exercise ${exercises[1].name} cannot be part of selected component`,
      );
    }); */

    it('should fail to create new training if some exercises are from other institution', async () => {
      const otherAthlete = await createAthleteUserAndToken(firebase);
      const otherTrainer = await createTrainerUserAndToken(firebase);
      const otherManager = await createManagerUserAndToken(firebase);

      const otherInstitution = await createInstitution(institutionService, {
        owner: otherManager,
        athleteIds: [otherAthlete.uid],
        trainerIds: [otherTrainer.uid],
      });

      const otherGroup = await createGroupWithCycles(groupService, {
        trainer: otherTrainer,
        manager: otherManager,
        institutionId: otherInstitution.id,
        membersIds: [otherAthlete.uid],
      });

      const globalExercise = await exerciseService.create(
        global.admin,
        generateExerciseStub({ componentIds: [component.id] }),
      );

      const exercise = await exerciseService.create(
        global.manager,
        generateExerciseStub({ componentIds: [component.id] }),
      );

      const otherInstitutionExercise = await exerciseService.create(
        otherManager,
        generateExerciseStub({ componentIds: [component.id] }),
      );

      const from = addDays(new Date(), 1);
      const training = generateTrainingStub({
        groupId: otherGroup.id,
        cycleId: otherGroup.cycles[1].id,
        from,
        to: addHours(from, 1),
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: globalExercise.id }),
                  generateTrainingExercise({ id: otherInstitutionExercise.id }),
                  generateTrainingExercise({ id: exercise.id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/training')
        .set('Authorization', `Bearer ${otherTrainer.token}`)
        .send(training);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        `You cannot view exercise ${exercise.name}`,
      );

      await Promise.all([
        deleteUsers(firebase, [otherAthlete, otherTrainer, otherManager]),
        deleteDoc(firebase, 'INSTITUTION', otherInstitution.id),
        deleteDoc(firebase, 'GROUP', otherGroup.id),
        deleteDocs(firebase, 'EXERCISE', [
          globalExercise.id,
          exercise.id,
          otherInstitutionExercise.id,
        ]),
      ]);
    });

    it.each([
      ['trainer', global.trainer],
      ['manager', global.manager],
    ])(
      'should successfully create institutional training if user is institution %s',
      async (_, user) => {
        // create overlapping training in another group to ensure no error is thrown
        const component = await componentService.create(
          generateComponentStub({
            params: {
              [DEFAULT_PARAMS_KEY]: [
                { field: ParamType.VolWorkSets },
                {
                  field: ParamType.VolWork1,
                  options: [{ field: VolType.Rep }, { field: VolType.Dist }],
                },
              ],
            },
          }),
        );

        const globalExercise = await exerciseService.create(
          global.admin,
          generateExerciseStub({ componentIds: [component.id] }),
        );

        const exercise = await exerciseService.create(
          global.manager,
          generateExerciseStub({ componentIds: [component.id] }),
        );

        const from = addDays(new Date(), 1);
        const training = generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          from,
          to: addHours(from, 1),
          components: [
            generateTrainingComponent({
              id: component.id,
              supersets: [
                generateSuperset({
                  exercises: [
                    generateTrainingExercise({ id: globalExercise.id }),
                    generateTrainingExercise({ id: exercise.id }),
                  ],
                }),
              ],
            }),
          ],
        });

        const response = await request(app.getHttpServer())
          .post('/training')
          .set('Authorization', `Bearer ${user.token}`)
          .send(training);

        expect(response.status).toBe(201);
        expect(response.body.groupId).toBe(group.id);
        expect(response.body.cycleId).toBe(group.cycles[1].id);
        expect(response.body.ownerId).toBe(user.uid);
        expect(response.body.membersIds).toEqual([global.athlete.uid]);
        expect(response.body.components).toHaveLength(1);
        expect(response.body.components[0].supersets).toHaveLength(1);
        expect(response.body.components[0].supersets[0].exercises).toHaveLength(
          2,
        );

        // all training exercises should have correct component params
        const trainingExercises = (
          response.body.components as TrainingComponent[]
        ).flatMap((c) => c.supersets.flatMap((s) => s.exercises));

        for (const e of trainingExercises) {
          expect(e.params).toEqual([
            PARAMS.find((p) => p.field === ParamType.VolWorkSets),
            {
              ...PARAMS.find((p) => p.field === ParamType.VolWork1),
              options: [
                VOL_OPTIONS.find((o) => o.field === VolType.Rep),
                VOL_OPTIONS.find((o) => o.field === VolType.Dist),
              ],
            },
          ]);

          expect(e.sets).toEqual([
            {
              setNumber: 1,
              paramValuesL: [
                {
                  field: ParamType.VolWork1,
                  selected: VolType.Rep,
                  value: '12',
                },
              ],
              paramValuesR: [
                {
                  field: ParamType.VolWork1,
                  selected: VolType.Rep,
                  value: '12',
                },
              ],
            },
            {
              setNumber: 2,
              paramValuesL: [
                {
                  field: ParamType.VolWork1,
                  selected: VolType.Rep,
                  value: '12',
                },
              ],
              paramValuesR: [
                {
                  field: ParamType.VolWork1,
                  selected: VolType.Rep,
                  value: '12',
                },
              ],
            },
            {
              setNumber: 3,
              paramValuesL: [
                {
                  field: ParamType.VolWork1,
                  selected: VolType.Rep,
                  value: '12',
                },
              ],
              paramValuesR: [
                {
                  field: ParamType.VolWork1,
                  selected: VolType.Rep,
                  value: '12',
                },
              ],
            },
          ]);
        }

        // it should create user workloads
        const workloads = (
          await workloadService.findAllByTraining(response.body.id)
        ).sort((a, b) => {
          return a.setNumber - b.setNumber;
        });

        // 1 group member x 2 exercises x 3 sets each (default) = 6 workloads
        expect(workloads).toHaveLength(6);
        expect(workloads[0]).toEqual({
          userId: athlete.uid,
          groupId: group.id,
          cycleId: group.cycles[1].id,
          plannedAt: expect.anything(),
          trainingId: response.body.id,
          componentId: component.id,
          exerciseId: expect.anything(),
          setNumber: 1,
          notes: null,
          isPersonalized: false,
          deletedAt: null,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
          volWork1Type: VolType.Rep,
          prescribedVolWork1ValueL: 12,
          prescribedVolWork1ValueR: 12,
          volWork1ValueL: null,
          volWork1ValueR: null,
          volWork2ValueL: null,
          volWork2ValueR: null,
          intRecValueL: null,
          intRecValueR: null,
          volRecValueL: null,
          volRecValueR: null,
          intWork1ValueL: null,
          intWork1ValueR: null,
          intWork2ValueL: null,
          intWork2ValueR: null,
          status: SetStatus.NOT_STARTED,
        } as Workload);

        await Promise.all([
          deleteDocs(firebase, 'EXERCISE', [globalExercise.id, exercise.id]),
          deleteDoc(firebase, 'COMPONENT', component.id),
          deleteDoc(firebase, 'TRAINING', response.body.id),
          deleteCollection(firebase, 'TRAINING_WORKLOAD'),
        ]);
      },
    );
  });

  describe('Training components', () => {
    it('should fail to add components if training does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/training/invalid-training-id/component')
        .set('Authorization', `Bearer ${trainer.token}`)
        .send({ components: [generateTrainingComponent()] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Training not found');
    });

    it('should fail to add components if user is not allowed to edit training', async () => {
      const training = await trainingService.create(
        trainer,
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: component.id,
              supersets: [generateSuperset({})],
            }),
          ],
        }),
      );

      const response = await request(app.getHttpServer())
        .post(`/training/${training.id}/component`)
        .set('Authorization', `Bearer ${athlete.token}`)
        .send({
          components: [generateTrainingComponent({})],
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You cannot edit this training');

      await deleteDoc(firebase, 'TRAINING', training.id);
    });

    it('should fail to add components if training is in the past', async () => {
      const training = await firebase.firestore
        .collection(FirestoreCollection.TRAINING)
        .add(
          firebase.buildCreateQuery(
            generateTrainingStub({
              groupId: group.id,
              cycleId: group.cycles[0].id,
              from: subDays(new Date(), 2),
              to: subDays(new Date(), 2),
              components: [
                generateTrainingComponent({
                  from: subDays(new Date(), 2),
                  to: subDays(new Date(), 2),
                }),
              ],
            }),
            { timestamps: true },
          ),
        );

      const response = await request(app.getHttpServer())
        .post(`/training/${training.id}/component`)
        .set('Authorization', `Bearer ${trainer.token}`)
        .send({ components: [generateTrainingComponent()] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot add or update trainings in the past',
      );

      await deleteDoc(firebase, 'TRAINING', training.id);
    });
  });

  it('should successfully add training components', async () => {
    const newComponent = await componentService.create(generateComponentStub());
    const training = await trainingService.create(
      trainer,
      generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [generateSuperset()],
          }),
        ],
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/training/${training.id}/component`)
      .set('Authorization', `Bearer ${trainer.token}`)
      .send({
        components: [generateTrainingComponent({ id: newComponent.id })],
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(training.id);
    expect(response.body.components).toHaveLength(2);

    await Promise.all([
      deleteDoc(firebase, 'COMPONENT', newComponent.id),
      deleteDocs(firebase, 'TRAINING', [training.id, response.body.id]),
    ]);
  });

  it('should successfully delete training component', async () => {
    const newComponent = await componentService.create(generateComponentStub());
    const training = await trainingService.create(
      trainer,
      generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [generateSuperset()],
            from: getTime(addDays(new Date(), 2), 8, 0),
            to: getTime(addDays(new Date(), 2), 9, 0),
          }),
          generateTrainingComponent({
            id: newComponent.id,
            supersets: [generateSuperset()],
            from: getTime(addDays(new Date(), 2), 9, 0),
            to: getTime(addDays(new Date(), 2), 10, 0),
          }),
        ],
      }),
    );

    const response = await request(app.getHttpServer())
      .delete(`/training/${training.id}/component/${newComponent.id}`)
      .set('Authorization', `Bearer ${trainer.token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(training.id);
    expect(response.body.components).toHaveLength(1);

    await Promise.all([
      deleteDoc(firebase, 'COMPONENT', newComponent.id),
      deleteDocs(firebase, 'TRAINING', [training.id, response.body.id]),
    ]);
  });

  it('should delete training when training has no more components', async () => {
    const training = await trainingService.create(
      trainer,
      generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [generateSuperset()],
          }),
        ],
      }),
    );

    const response = await request(app.getHttpServer())
      .delete(`/training/${training.id}/component/${component.id}`)
      .set('Authorization', `Bearer ${trainer.token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(training.id);
    expect(response.body.components).toHaveLength(0);

    const trainings = await trainingService.findAll(trainer);
    expect(trainings).toHaveLength(0);

    await Promise.all([deleteDoc(firebase, 'TRAINING', training.id)]);
  });
});
