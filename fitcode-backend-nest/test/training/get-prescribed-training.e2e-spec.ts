import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { COMPONENT_PARAMS_OPT1 } from '@test/common/constant/component-params.constant';
import type { TestInstitution } from '@test/common/type/entity.type';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
} from '@test/common/utils/data.util';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import type { Component } from '@src/component/entity/component.entity';
import { IntType, VolType } from '@src/component/enum/param.enum';
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
import { SetStatus } from '@src/training/enum/set-status.enum';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { WorkloadService } from '@src/training/service/workload.service';

describe('Get prescribed training (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let workloadService: WorkloadService;

  let component: Component;
  let exercises: Exercise[];
  let institution: TestInstitution;
  let group: Group;

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

    institution = await createInstitution(institutionService, {
      athletes: [global.athlete],
    });

    group = await createGroupWithCycles(groupService, institution);
  });

  afterAll(async () => {
    await Promise.all([
      db.exercises.clear(),
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteCollection(firebase, 'COMPONENT'),
    ]);

    await app.close();
  });

  function url(trainingId: string) {
    return `/training/${trainingId}/athlete/${global.athlete.uid}/prescribed`;
  }

  it('should get prescribed training for athlete for main group', async () => {
    const sets = [
      generateExerciseSet(1, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(2, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(3, COMPONENT_PARAMS_OPT1),
    ];

    const trainingId = await db.trainings.addDoc(
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
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: 'squat', sets }),
                  generateTrainingExercise({ id: 'deadlift', sets }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const training = await db.trainings.getDoc(trainingId);
    const response = await request(app.getHttpServer())
      .get(url(training.id))
      .set('Authorization', `Bearer ${global.athlete.token}`)
      .expect(200);

    const trainingComponents = response.body.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(2);
    expect(trainingComponent.supersets[0].exercises).toHaveLength(2);
    expect(trainingComponent.supersets[1].exercises).toHaveLength(2);

    const firstExercise = trainingComponent.supersets[0].exercises[0];
    expect(firstExercise.id).toBe(exercises[0].id);
    expect(firstExercise.sets).toHaveLength(3);
    expect(firstExercise.sets[0].paramValuesL).toHaveLength(2); // from COMPONENT_PARAMS_OPT1 (exclude VolWorkSets) you get 2

    const paramValues = firstExercise.sets[0].paramValuesL;
    const repField = paramValues.find((p) => p.selected === VolType.Rep);
    expect(repField).toBeDefined();
    expect(+repField.value).toBe(12); // default value

    const kgField = paramValues.find((p) => p.selected === IntType.Kg);
    expect(kgField).toBeDefined();
    expect(+kgField.value).toBe(20);

    await db.trainings.deleteDoc(training.id);
  });

  it('should get prescribed training for athlete for subgroup', async () => {
    const sets = [
      generateExerciseSet(1, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(2, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(3, COMPONENT_PARAMS_OPT1),
    ];

    const trainingId = await db.trainings.addDoc(
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
              // main group only 1 superset and 1 exercise
              generateSuperset({
                exercises: [generateTrainingExercise({ id: 'squat', sets })],
              }),
            ],
            subgroups: [
              generateSubgroup({
                membersIds: [global.athlete.uid],
                supersets: [
                  // subgroup has 2 supersets and 3 exercises
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'squat', sets }),
                    ],
                  }),
                  generateSuperset({
                    exercises: [
                      generateTrainingExercise({ id: 'bench', sets }),
                      generateTrainingExercise({ id: 'deadlift', sets }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const training = await db.trainings.getDoc(trainingId);
    const response = await request(app.getHttpServer())
      .get(url(training.id))
      .set('Authorization', `Bearer ${global.athlete.token}`)
      .expect(200);

    const trainingComponents = response.body.components;
    expect(trainingComponents).toHaveLength(1);

    const trainingComponent = trainingComponents[0] as TrainingComponent;
    expect(trainingComponent.id).toBe(training.components[0].id);
    expect(trainingComponent.from).toBeDefined();
    expect(trainingComponent.supersets).toHaveLength(2);
    expect(trainingComponent.supersets[0].exercises).toHaveLength(1);
    expect(trainingComponent.supersets[1].exercises).toHaveLength(2);

    const firstExercise = trainingComponent.supersets[0].exercises[0];
    expect(firstExercise.sets).toHaveLength(3);
    expect(firstExercise.sets[0].paramValuesL).toHaveLength(2);

    const paramValues = firstExercise.sets[0].paramValuesL;
    const repField = paramValues.find((p) => p.selected === VolType.Rep);
    expect(repField).toBeDefined();
    expect(+repField.value).toBe(12); // default value

    const kgField = paramValues.find((p) => p.selected === IntType.Kg);
    expect(kgField).toBeDefined();
    expect(+kgField.value).toBe(20);

    const secondExercise = trainingComponent.supersets[1].exercises[0];
    expect(secondExercise.sets).toHaveLength(3);
    expect(secondExercise.sets[0].paramValuesL).toHaveLength(2);

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
    expect(thirdExercise.sets).toHaveLength(3);
    expect(thirdExercise.sets[0].paramValuesL).toHaveLength(2);

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

    await db.trainings.deleteDoc(training.id);
  });

  it('should get prescribed training for athlete in main group with custom workloads', async () => {
    const sets = [
      generateExerciseSet(1, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(2, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(3, COMPONENT_PARAMS_OPT1),
    ];

    const trainingId = await db.trainings.addDoc(
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

    const training = await db.trainings.getDoc(trainingId);

    await db.workloads.createMany([
      {
        trainingId: training.id,
        component,
        exerciseId: exercises[0].id,
        userId: global.athlete.uid,
        supersetIndex: 0,
        setNumber: 1,
        prescribedIntWork1ValueL: 100,
        status: SetStatus.NOT_STARTED,
      },
      {
        trainingId: training.id,
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
    const response = await request(app.getHttpServer())
      .get(url(training.id))
      .set('Authorization', `Bearer ${global.athlete.token}`)
      .expect(200);

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

    await db.trainings.deleteDoc(training.id);
  });

  it('should get prescribed training for athlete in subgroup with custom workloads', async () => {
    const sets = [
      generateExerciseSet(1, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(2, COMPONENT_PARAMS_OPT1),
      generateExerciseSet(3, COMPONENT_PARAMS_OPT1),
    ];

    const trainingId = await db.trainings.addDoc(
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

    const training = await db.trainings.getDoc(trainingId);
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
    const response = await request(app.getHttpServer())
      .get(url(training.id))
      .set('Authorization', `Bearer ${global.athlete.token}`)
      .expect(200);

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

    await db.trainings.deleteDoc(training.id);
  });
});
