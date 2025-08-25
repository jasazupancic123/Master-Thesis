import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { COMPONENT_PARAMS_OPT1 } from '@test/common/constant/component-params.constant';
import type { TestUser } from '@test/common/type/auth.type';
import type { TestInstitution } from '@test/common/type/entity.type';
import { createAthleteUserAndToken } from '@test/common/utils/auth.util';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
  deleteUsers,
} from '@test/common/utils/data.util';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import type { Component } from '@src/component/entity/component.entity';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { TestDbService } from '@src/test-db/test-db.service';
import type { TrainingComponent } from '@src/training/entity/training-component.entity';
import type { TrainingExercise } from '@src/training/entity/training-exercise.entity';
import { SetStatus } from '@src/training/enum/set-status.enum';
import { generateParamAttributeValuesFromComponentParams } from '@src/training/mock/param-values.stub';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingPlanService } from '@src/training/service/training-plan.service';
import { WorkloadService } from '@src/training/service/workload.service';

describe('Get prescribed training (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let workloadService: WorkloadService;
  let trainingPlanService: TrainingPlanService;

  let component: Component;
  let exercises: Exercise[];
  let institution: TestInstitution;
  let group: Group;
  let trainingId: string;
  let a: TestUser;
  let b: TestUser;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = app.get(TestDbService);
    firebase = app.get(FirebaseService);
    componentService = app.get(ComponentService);
    exerciseService = app.get(ExerciseService);
    workloadService = app.get(WorkloadService);
    trainingPlanService = app.get(TrainingPlanService);

    const institutionService = app.get(InstitutionService);
    const groupService = app.get(GroupService);

    component = await componentService.create(
      generateComponentStub({
        params: { [DEFAULT_PARAMS_KEY]: COMPONENT_PARAMS_OPT1 },
      }),
    );

    exercises = await exerciseService.upsertMany(global.admin, [
      generateExerciseStub({ name: 'Squat', componentIds: [component.id] }),
      generateExerciseStub({ name: 'Bench', componentIds: [component.id] }),
      generateExerciseStub({ name: 'Deadlift', componentIds: [component.id] }),
    ]);

    a = await createAthleteUserAndToken(firebase);
    b = await createAthleteUserAndToken(firebase);

    institution = await createInstitution(institutionService, {
      athletes: [global.athlete, a, b],
    });

    group = await createGroupWithCycles(groupService, institution);
    trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [global.athlete.uid, a.uid, b.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: component.id,
            from: new Date(),
            supersets: [
              // main group only 1 superset and 1 exercise with 3 sets
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateExerciseSet(1),
                      generateExerciseSet(2),
                      generateExerciseSet(3),
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
                        sets: [generateExerciseSet(1)],
                      }),
                    ],
                  }),
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({
                        id: 'bench',
                        sets: [generateExerciseSet(1), generateExerciseSet(2)],
                      }),
                      generateTrainingExercise({
                        id: 'deadlift',
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
                          generateExerciseSet(1),
                          generateExerciseSet(2),
                          generateExerciseSet(3),
                          generateExerciseSet(4),
                          generateExerciseSet(5),
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
    await Promise.all([
      db.exercises.clear(),
      db.trainings.delete(trainingId),
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteCollection(firebase, 'COMPONENT'),
      deleteUsers(firebase, [a, b]),
    ]);

    await app.close();
  });

  async function req(user: TestUser, trainingId: string) {
    return await request(app.getHttpServer())
      .get(`/training/${trainingId}/athlete/${global.athlete.uid}/prescribed`)
      .set('Authorization', `Bearer ${user.token}`);
  }

  it('should get prescribed training for athlete for main group', async () => {
    const training = await db.trainings.findById(trainingId);
    const response = await req(global.athlete, trainingId);
    expect(response.status).toBe(200);

    const trainingComponents = response.body.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(1);
    expect(trainingComponent.supersets[0].exercises).toHaveLength(1);

    const firstExercise = trainingComponent.supersets[0].exercises[0];
    expect(firstExercise.id).toBe('squat');
    expect(firstExercise.sets).toHaveLength(3);
    expect(firstExercise.sets[0].paramValuesL).toHaveLength(6); // all params

    const paramValues = firstExercise.sets[0].paramValuesL;
    const repField = paramValues.find((p) => p.selected === VolType.Rep);
    expect(repField).toBeDefined();
    expect(+repField.value).toBe(12); // default value

    const kgField = paramValues.find((p) => p.selected === IntType.Kg);
    expect(kgField).toBeDefined();
    expect(+kgField.value).toBe(20);
  });

  it('should get prescribed training for athlete for subgroup', async () => {
    const training = await db.trainings.findById(trainingId);
    const response = await req(b, trainingId);
    expect(response.status).toBe(200);

    const trainingComponents = response.body.components;
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
    expect(firstExercise.sets[0].paramValuesL).toHaveLength(6);

    const paramValues = firstExercise.sets[0].paramValuesL;
    const repField = paramValues.find((p) => p.selected === VolType.Rep);
    expect(repField).toBeDefined();
    expect(+repField.value).toBe(12); // default value

    const kgField = paramValues.find((p) => p.selected === IntType.Kg);
    expect(kgField).toBeDefined();
    expect(+kgField.value).toBe(20);

    const secondExercise = trainingComponent.supersets[1].exercises[0];
    expect(secondExercise.id).toBe('bench');
    expect(secondExercise.sets).toHaveLength(2);
    expect(secondExercise.sets[0].paramValuesL).toHaveLength(6);

    const secondParamValues = secondExercise.sets[0].paramValuesL;
    const secondRepField = secondParamValues.find(
      (p) => p.selected === VolType.Rep,
    );

    expect(secondRepField).toBeDefined();
    expect(+secondRepField.value).toBe(12); // default value

    const secondKgField = secondParamValues.find(
      (p) => p.selected === IntType.Kg,
    );
    expect(secondKgField).toBeDefined();
    expect(+secondKgField.value).toBe(20);

    const thirdExercise = trainingComponent.supersets[1].exercises[1];
    expect(thirdExercise.id).toBe('deadlift');
    expect(thirdExercise.sets).toHaveLength(3);
    expect(thirdExercise.sets[0].paramValuesL).toHaveLength(6);

    const thirdParamValues = thirdExercise.sets[0].paramValuesL;
    const thirdRepField = thirdParamValues.find(
      (p) => p.selected === VolType.Rep,
    );
    expect(thirdRepField).toBeDefined();
    expect(+thirdRepField.value).toBe(12); // default value

    const thirdKgField = thirdParamValues.find(
      (p) => p.selected === IntType.Kg,
    );
    expect(thirdKgField).toBeDefined();
    expect(+thirdKgField.value).toBe(20);
  });

  it('should get prescribed training for athlete for child subgroup', async () => {
    const training = await db.trainings.findById(trainingId);
    const response = await req(a, trainingId);
    expect(response.status).toBe(200);

    const trainingComponents = response.body.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(1); // child subgroup merged into parent for athlete
    expect(trainingComponent.supersets[0].exercises).toHaveLength(1);
    expect(trainingComponent.supersets[0].exercises[0].id).toBe('x');
    expect(trainingComponent.supersets[0].exercises[0].sets).toHaveLength(5);
  });

  it('should get prescribed training for athlete in main group with custom workloads', async () => {
    const sets = [
      generateExerciseSet(1, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(2, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(3, COMPONENT_PARAMS_OPT1),
    ];

    const trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [global.athlete.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: component.id,
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: 'squat', sets }),
                  generateTrainingExercise({ id: 'bench', sets }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const training = await db.trainings.findById(trainingId);

    await db.workloads.createMany([
      {
        trainingId,
        component,
        exerciseId: exercises[0].id,
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 1,
        prescribedIntWork1ValueL: 100,
        status: SetStatus.NOT_STARTED,
      },
      {
        trainingId,
        component,
        exerciseId: exercises[0].id,
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 2,
        prescribedIntWork1ValueL: 101,
        status: SetStatus.NOT_STARTED,
      },
    ]);

    const workloads = await db.workloads.getAll(training.id);
    expect(workloads).toHaveLength(2);

    const spy = jest.spyOn(workloadService, 'getExerciseSet');
    const response = await req(global.athlete, trainingId);
    expect(response.status).toBe(200);

    expect(spy).toHaveBeenCalledTimes(2); // 2 custom workloads
    spy.mockRestore();

    const trainingComponents = response.body.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(1);
    expect(trainingComponent.supersets[0].exercises).toHaveLength(2);

    const firstExercise = trainingComponent.supersets[0].exercises.find(
      (e) => e.id === exercises[0].id,
    );

    expect(firstExercise).toBeDefined();
    expect(firstExercise.sets).toHaveLength(3);
    expect(firstExercise.sets[0].paramValuesL).toHaveLength(2);
    expect(firstExercise.sets[1].paramValuesL).toHaveLength(2);
    expect(firstExercise.sets[2].paramValuesL).toHaveLength(2);

    const firstSet = firstExercise.sets[0];
    const indexOfInt = firstSet.paramValuesL.findIndex(
      (p) => p.selected === IntType.Kg,
    );

    expect(firstSet.paramValuesL[indexOfInt].value).toBe('100');
    expect(firstSet.paramValuesL[indexOfInt].selected).toBe(IntType.Kg);
    firstSet.paramValuesL.forEach((p, i) => {
      if (i !== indexOfInt) {
        if (p.selected === IntType.Kg) expect(p.value).toBe('20');
        if (p.selected === VolType.Rep) expect(p.value).toBe('12');
      }
    });

    const secondSet = firstExercise.sets[1];
    const secondIndexOfInt = secondSet.paramValuesL.findIndex(
      (p) => p.selected === IntType.Kg,
    );

    expect(secondSet.paramValuesL[secondIndexOfInt].value).toBe('101');
    expect(secondSet.paramValuesL[secondIndexOfInt].selected).toBe(IntType.Kg);
    secondSet.paramValuesL.forEach((p, i) => {
      if (i !== secondIndexOfInt) {
        if (p.selected === IntType.Kg) expect(p.value).toBe('20');
        if (p.selected === VolType.Rep) expect(p.value).toBe('12');
      }
    });

    const thirdSet = firstExercise.sets[2];
    thirdSet.paramValuesL.forEach((p) => {
      if (p.selected === IntType.Kg) expect(p.value).toBe('20');
      if (p.selected === VolType.Rep) expect(p.value).toBe('12');
    });

    const secondExercise = trainingComponent.supersets[0].exercises.find(
      (e) => e.id === exercises[1].id,
    );

    expect(secondExercise).toBeDefined();
    expect(secondExercise.sets).toHaveLength(3);
    expect(secondExercise.sets[0].paramValuesL).toHaveLength(2);
    secondExercise.sets.forEach((set) => {
      set.paramValuesL.forEach((p) => {
        if (p.selected === IntType.Kg) expect(p.value).toBe('20');
        if (p.selected === VolType.Rep) expect(p.value).toBe('12');
      });
    });

    await db.trainings.delete(trainingId);
  });

  it('should get prescribed training for athlete in subgroup with custom workloads', async () => {
    const sets = [
      generateExerciseSet(1, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(2, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(3, COMPONENT_PARAMS_OPT1),
    ];

    const trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.uid,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        membersIds: [global.athlete.uid],
        date: new Date(),
        components: [
          generateTrainingComponent({
            id: component.id,
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'deadlift', sets })],
              }),
            ],
            subgroups: [
              generateSubgroup({
                id: component.id,
                membersIds: [global.athlete.uid],
                supersets: [
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'squat', sets }),
                      generateTrainingExercise({ id: 'bench', sets }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const training = await db.trainings.findById(trainingId);
    await db.workloads.createMany([
      {
        trainingId: training.id,
        component,
        exerciseId: 'bench',
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 1,
        prescribedIntWork1ValueL: 100,
        status: SetStatus.NOT_STARTED,
      },
      {
        trainingId: training.id,
        component,
        exerciseId: 'bench',
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 2,
        prescribedIntWork1ValueL: 101,
        status: SetStatus.NOT_STARTED,
      },
    ]);

    const workloads = await db.workloads.getAll(training.id);
    expect(workloads).toHaveLength(2);

    const spy = jest.spyOn(workloadService, 'getExerciseSet');
    const response = await req(global.athlete, trainingId);
    expect(response.status).toBe(200);

    expect(spy).toHaveBeenCalledTimes(2); // 2 custom workloads
    spy.mockRestore();

    const trainingComponents = response.body.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(1);
    expect(trainingComponent.supersets).toHaveLength(1); // even though its subgroup, for user it's populated as main group
    expect(trainingComponent.supersets[0].exercises).toHaveLength(2);

    const superset = trainingComponent.supersets[0];
    const firstExercise = superset.exercises.find((e) => e.id === 'squat');

    expect(firstExercise).toBeDefined();
    expect(firstExercise.sets).toHaveLength(3);
    expect(firstExercise.sets[0].paramValuesL).toHaveLength(2);
    expect(firstExercise.sets[1].paramValuesL).toHaveLength(2);
    expect(firstExercise.sets[2].paramValuesL).toHaveLength(2);

    // first exercise should have default values
    for (const set of firstExercise.sets) {
      set.paramValuesL.forEach((p) => {
        if (p.selected === IntType.Kg) expect(p.value).toBe('20');
        if (p.selected === VolType.Rep) expect(p.value).toBe('12');
      });
    }

    const secondExercise = superset.exercises.find((e) => e.id === 'bench');
    expect(secondExercise).toBeDefined();
    expect(secondExercise.sets).toHaveLength(3);
    expect(secondExercise.sets[0].paramValuesL).toHaveLength(2);
    expect(secondExercise.sets[1].paramValuesL).toHaveLength(2);
    expect(secondExercise.sets[2].paramValuesL).toHaveLength(2);

    const firstSet = secondExercise.sets[0];
    const indexOfInt = firstSet.paramValuesL.findIndex(
      (p) => p.selected === IntType.Kg,
    );

    expect(firstSet.paramValuesL[indexOfInt].value).toBe('100');
    expect(firstSet.paramValuesL[indexOfInt].selected).toBe(IntType.Kg);
    firstSet.paramValuesL.forEach((p, i) => {
      if (i !== indexOfInt) {
        if (p.selected === IntType.Kg) expect(p.value).toBe('20');
        if (p.selected === VolType.Rep) expect(p.value).toBe('12');
      }
    });

    const secondSet = secondExercise.sets[1];
    const secondIndexOfInt = secondSet.paramValuesL.findIndex(
      (p) => p.selected === IntType.Kg,
    );

    expect(secondSet.paramValuesL[secondIndexOfInt].value).toBe('101');
    expect(secondSet.paramValuesL[secondIndexOfInt].selected).toBe(IntType.Kg);
    secondSet.paramValuesL.forEach((p, i) => {
      if (i !== secondIndexOfInt) {
        if (p.selected === IntType.Kg) expect(p.value).toBe('20');
        if (p.selected === VolType.Rep) expect(p.value).toBe('12');
      }
    });

    const thirdSet = secondExercise.sets[2];
    thirdSet.paramValuesL.forEach((p) => {
      if (p.selected === IntType.Kg) expect(p.value).toBe('20');
      if (p.selected === VolType.Rep) expect(p.value).toBe('12');
    });

    await db.trainings.delete(trainingId);
  });

  it('should populate weight for exercises with bodyweight param', async () => {
    function generateSet(n: number) {
      return generateExerciseSet(
        n,
        generateParamAttributeValuesFromComponentParams(
          [
            {
              field: ParamType.IntWork1,
              defaultValue: IntType.Bw,
            },
          ],
          true,
        ),
      );
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
            id: component.id,
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift', // deadlift has bodyweight param
                    sets: [generateSet(1), generateSet(2), generateSet(3)],
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
                    sets: [generateSet(1), generateSet(2), generateSet(3)],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const spy = jest.spyOn(
      trainingPlanService,
      'getTrainingExercisesByParamType',
    );

    // insert wellness weight for athlete
    const response = await req(global.athlete, trainingId);
    expect(response.status).toBe(200);

    const spyResult = spy.mock.results[0].value as TrainingExercise[];
    expect(spyResult).toHaveLength(2);
    expect(spyResult.map((e) => e.id).sort()).toEqual(['bench', 'deadlift']);
    spy.mockRestore();

    await db.trainings.delete(trainingId);
  });
});
