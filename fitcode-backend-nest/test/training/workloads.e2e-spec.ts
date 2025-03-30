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
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { UserService } from '../../src/user/user.service';
import { createGroupWithCycles } from '../utils/data.util';
import {
  DEFAULT_PARAMS_KEY,
  INT_OPTIONS,
  PARAMS,
  VOL_OPTIONS,
} from '../../src/component/constant/param.constant';
import {
  IntType,
  ParamType,
  VolType,
} from '../../src/component/enum/param.enum';
import { UserWorkloadService } from '../../src/training/service/user-workload.service';
import { TrainingComponent } from '../../src/training/entity/training-component.entity';
import { createAthleteUserAndToken } from '../utils/auth.util';

describe('Create Training (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let userService: UserService;
  let workloadService: UserWorkloadService;

  let group: Group;
  let component: Component;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    userService = moduleFixture.get(UserService);
    workloadService = moduleFixture.get(UserWorkloadService);

    component = await componentService.create(generateComponentStub());

    const [athlete2, athlete3] = await Promise.all([
      createAthleteUserAndToken(firebaseService),
      createAthleteUserAndToken(firebaseService),
    ]);

    group = await createGroupWithCycles(groupService, {
      owner: trainer,
      membersIds: [athlete.uid, athlete2.uid, athlete3.uid],
    });
  });

  beforeEach(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await firebaseService.deleteCollection(
      FirestoreCollection.TRAINING_WORKLOAD,
    );
  });

  afterAll(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await firebaseService.deleteCollection(FirestoreCollection.GROUP);
    await firebaseService.deleteCollection(FirestoreCollection.TRAINING);
    await app.close();
  });

  describe('Create workloads', () => {
    it('should successfully create training worklaods for all members for training if only sets are provided', async () => {});

    it('should successfully create training workloads for all members for training for a single param value', async () => {});

    it('should successfully create training workloads for all members for training for multiple param values', async () => {
      const component = await componentService.create(
        generateComponentStub({
          params: {
            [DEFAULT_PARAMS_KEY]: [
              { field: ParamType.VolWorkSets },
              {
                field: ParamType.VolWork1,
                options: [{ field: VolType.Rep }, { field: VolType.Dist }],
              },
              {
                field: ParamType.IntWork1,
                options: [{ field: IntType.Kg }],
              },
            ],
          },
        }),
      );

      const exercises = await exerciseService.createMany(trainer, [
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

      const trainingExercises = (
        response.body.components as TrainingComponent[]
      ).flatMap((c) => c.supersets.flatMap((s) => s.exercises));

      for (const e of trainingExercises)
        expect(e.params).toEqual([
          PARAMS.find((p) => p.field === ParamType.VolWorkSets),
          {
            ...PARAMS.find((p) => p.field === ParamType.VolWork1),
            options: [
              VOL_OPTIONS.find((o) => o.field === VolType.Rep),
              VOL_OPTIONS.find((o) => o.field === VolType.Dist),
            ],
          },
          {
            ...PARAMS.find((p) => p.field === ParamType.IntWork1),
            options: [INT_OPTIONS.find((o) => o.field === IntType.Kg)],
          },
        ]);

      const workloads = await workloadService.findAllByTraining(
        response.body.id,
      );

      expect(workloads).toHaveLength(27); // 3 members * 3 exercises * 3 sets each

      for (const workload of workloads) {
        expect(workload.volWork1Type).toBe(VolType.Rep);
        expect(workload.intWork1Type).toBe(IntType.Kg);
      }
    });

    it('should successfully create training workloads for all members for training for percent value workloads', async () => {});

    it('should successfully create training workloads for all members for training for rm', async () => {});

    it('should successfully create training workloads for all members for training for bw', async () => {});
  });

  describe('Update workloads', () => {
    it('should re-create training workloads if training exercise data is updated', async () => {});

    it('should update exercise worklaods by provided component id', async () => {});
  });
});
