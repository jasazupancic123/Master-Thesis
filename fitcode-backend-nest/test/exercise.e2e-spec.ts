import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { FirebaseService } from '../src/firebase/firebase.service';
import { ExerciseService } from '../src/exercise/service/exercise.service';
import {
  createGroupWithCyclesAndTrainings,
  importExercises,
} from './utils/data.util';
import { FirestoreCollection } from '../src/common/enum/firestore-collection.enum';
import { Exercise } from '../src/exercise/entity/exercise.entity';
import { Group } from '../src/group/entity/group.entity';
import { GroupService } from '../src/group/group.service';
import { TrainingService } from '../src/training/service/training.service';
import { Cycle } from '../src/group/entity/cycle.entity';
import { Training } from '../src/training/entity/training.entity';

describe('ExerciseController (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let exerciseService: ExerciseService;
  let groupService: GroupService;
  let trainingService: TrainingService;

  let globalExercises: Exercise[];
  let group: Group;
  let cycles: Cycle[];
  let trainings: Training[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    exerciseService = moduleFixture.get(ExerciseService);
    groupService = moduleFixture.get(GroupService);
    trainingService = moduleFixture.get(TrainingService);

    globalExercises = await importExercises(exerciseService, global.admin);
    const [_group, _cycles, _trainings] =
      await createGroupWithCyclesAndTrainings(
        groupService,
        trainingService,
        global.trainer,
      );

    group = _group;
    cycles = _cycles;
    trainings = _trainings;
  });

  afterAll(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await app.close();
  });

  it('should return all global exercises for a user without trainers with populated attribute values', async () => {
    const response = await request(app.getHttpServer())
      .get('/exercise')
      .set('Authorization', `Bearer ${athlete.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(globalExercises.length);

    // each exercise should have atleast one attribute (because of exercises.json file)
    for (const exercise of response.body as Exercise[])
      expect(exercise.values.length).toBeGreaterThanOrEqual(1);
  });
});
