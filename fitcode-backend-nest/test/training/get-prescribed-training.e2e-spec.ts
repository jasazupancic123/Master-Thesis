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
import { subDays } from 'date-fns';
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
import type { Training } from '@src/training/entity/training.entity';
import type { TrainingComponent } from '@src/training/entity/training-component.entity';
import type { Workload } from '@src/training/entity/workload.entity';
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
import { WorkloadRepository } from '@src/training/repository/workload.repository';
import { WorkloadService } from '@src/training/service/workload.service';
import type { Wellness } from '@src/user/entity/wellness.entity';
import { UserService } from '@src/user/service/user.service';

describe('Get prescribed training (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let workloadService: WorkloadService;
  let userService: UserService;

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
    userService = app.get(UserService);

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
      db.trainings.clear(),
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteCollection(firebase, 'COMPONENT'),
      deleteUsers(firebase, [a, b]),
    ]);

    await app.close();
  });

  function generateSet(n: number, type: IntType, value: number) {
    if (!type) return generateExerciseSet(n);

    const paramValues = generateParamAttributeValuesFromComponentParams([
      {
        field: ParamType.IntWork1,
        defaultValue: type,
      },
    ]);

    for (const paramValue of paramValues)
      if (paramValue.selected === type) paramValue.value = value.toString();

    return generateExerciseSet(n, paramValues);
  }

  function findExercise(training: Training, id: string) {
    return training.components[0].supersets[0].exercises.find(
      (e) => e.id === id,
    );
  }

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
    db.checkpoint();

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
            id: component.id,
            from: new Date(),
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({
                    id: 'deadlift', // deadlift has bodyweight param
                    sets: [
                      generateSet(1, IntType.Bw, 75),
                      generateSet(2, IntType.Bw, 75),
                      generateSet(3, IntType.Bw, 75),
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
                      generateSet(1, IntType.Bw, 65),
                      generateSet(2, IntType.Bw, 65),
                      generateSet(3, IntType.Bw, 65),
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
      const bw = set.paramValuesL.find((p) => p.selected === IntType.Bw);
      expect(bw).toBeDefined();
      expect(+bw.value).toBe(75);
    });

    // all sets must have bw param of value 65 for bench
    bench.sets.forEach((set) => {
      const bw = set.paramValuesL.find((p) => p.selected === IntType.Bw);
      expect(bw).toBeDefined();
      expect(+bw.value).toBe(65);
    });

    const spy = jest.spyOn(userService, 'getLatestWellnessByUser');

    // insert wellness weight for athlete
    const response = await req(global.athlete, trainingId);
    expect(response.status).toBe(200);

    const spyResult = (await spy.mock.results[0].value) as Wellness;
    expect(spyResult.weight).toBe(85);
    spy.mockRestore();

    const trainingAfter = response.body as Training;
    deadlift = findExercise(trainingAfter, 'deadlift');
    bench = findExercise(trainingAfter, 'bench');

    // new deadlift param value should be 63.75 (85 * 0.75)
    deadlift.sets.forEach((set) => {
      const bw = set.paramValuesL.find((p) => p.selected === IntType.Bw);
      expect(bw).toBeDefined();
      expect(+bw.value).toBe(63.75);
    });

    // new bench param value should be 55.25 (85 * 0.65)
    bench.sets.forEach((set) => {
      const bw = set.paramValuesL.find((p) => p.selected === IntType.Bw);
      expect(bw).toBeDefined();
      expect(+bw.value).toBe(55.25);
    });

    await db.checkpointRestore();
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
            id: component.id,
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

    const spy = jest.spyOn(userService, 'getLatestWellnessByUser');
    const response = await req(global.athlete, trainingId);
    expect(response.status).toBe(200);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();

    await db.trainings.delete(trainingId);
  });

  it('should populate weight for exercises with rep max param', async () => {
    db.checkpoint();

    // create another (different) training before with workloads completed
    const otherTrainingId = await db.trainings.save(
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
      const workloadMeta = {
        component,
        trainingId: otherTrainingId,
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 1,
        status: SetStatus.NOT_STARTED,
      };

      return {
        ...workloadMeta,
        exerciseId,
        createdAt: date,
        intWork1ValueL: weight,
        volWork1ValueL: reps,
      };
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
                    id: 'deadlift',
                    sets: [
                      generateSet(1, IntType.Rm, 80), // rep max 80%
                      generateSet(2, IntType.Rm, 80),
                      generateSet(3, IntType.Rm, 80),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'bench',
                    sets: [
                      generateSet(2, IntType.Rm, 65),
                      generateSet(3, IntType.Rm, 65),
                    ],
                  }),
                  generateTrainingExercise({
                    id: 'squat',
                    sets: [
                      generateSet(1, IntType.Rm, 40),
                      generateSet(2, IntType.Rm, 40),
                      generateSet(3, IntType.Rm, 40),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    await db.workloads.createMany([
      generateWorkload('deadlift', subDays(new Date(), 7), 10, 130),
      generateWorkload('deadlift', subDays(new Date(), 3), 10, 140), // most recent
      generateWorkload('deadlift', subDays(new Date(), 5), 8, 150), // it should take this one since it has most weight
      generateWorkload('bench', subDays(new Date(), 10), 6, 70),
    ]);

    const trainingBefore = await db.trainings.findById(trainingId);
    let deadlift = findExercise(trainingBefore, 'deadlift');
    let bench = findExercise(trainingBefore, 'bench');
    let squat = findExercise(trainingBefore, 'squat');

    // all sets must have rm param of value 80 for deadlift
    deadlift.sets.forEach((set) => {
      const rm = set.paramValuesL.find((p) => p.selected === IntType.Rm);
      expect(rm).toBeDefined();
      expect(+rm.value).toBe(80);
    });

    // all sets must have rm param of value 65 for bench
    bench.sets.forEach((set) => {
      const rm = set.paramValuesL.find((p) => p.selected === IntType.Rm);
      expect(rm).toBeDefined();
      expect(+rm.value).toBe(65);
    });

    // all sets must have rm param of value 40 for squat
    squat.sets.forEach((set) => {
      const rm = set.paramValuesL.find((p) => p.selected === IntType.Rm);
      expect(rm).toBeDefined();
      expect(+rm.value).toBe(40);
    });

    const workloadRepository = app.get(WorkloadRepository);
    const spy = jest.spyOn(workloadRepository, 'findExerciseMax');
    const response = await req(global.athlete, trainingId);
    expect(response.status).toBe(200);

    expect(spy).toHaveBeenCalledTimes(3); // deadlift, bench, and squat
    const spyResults = await Promise.all(
      spy.mock.results.map((r) => r.value as Workload),
    );

    expect(
      spyResults.find((r) => r.exerciseId === 'deadlift').intWork1ValueL,
    ).toBe(150);
    expect(
      spyResults.find((r) => r.exerciseId === 'bench').intWork1ValueL,
    ).toBe(70);
    spy.mockRestore();

    // 150 * 0.8 = 120 for deadlift
    // 70 * 0.65 = 45.5 for bench
    const trainingAfter = response.body as Training;
    deadlift = findExercise(trainingAfter, 'deadlift');
    bench = findExercise(trainingAfter, 'bench');
    squat = findExercise(trainingAfter, 'squat');

    deadlift.sets.forEach((set) => {
      const rm = set.paramValuesL.find((p) => p.selected === IntType.Rm);
      expect(rm).toBeDefined();
      expect(+rm.value).toBe(152);
    });

    bench.sets.forEach((set) => {
      const rm = set.paramValuesL.find((p) => p.selected === IntType.Rm);
      expect(rm).toBeDefined();
      expect(+rm.value).toBe(54.6);
    });

    // squat should remain with default value since there is no previous workload
    squat.sets.forEach((set) => {
      const rm = set.paramValuesL.find((p) => p.selected === IntType.Rm);
      expect(rm).toBeDefined();
      expect(+rm.value).toBe(20); // no data, so default value of 20 kg is used
    });

    await db.checkpointRestore();
  });
});
