import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import { ComponentService } from '../../src/component/component.service';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';

describe('Create Many Exercises (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let attributeService: AttributeService;
  let componentService: ComponentService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    attributeService = moduleFixture.get(AttributeService);
    componentService = moduleFixture.get(ComponentService);
  });

  afterAll(async () => app.close());

  it('should not create exercises if duplicates are found', async () => {
    const exercises = [
      generateExerciseStub({ name: 'test' }),
      generateExerciseStub({ name: 'squat' }),
      generateExerciseStub({ name: 'squat' }),
    ];

    const response = await request(app.getHttpServer())
      .post(`/exercise/many`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ exercises });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(`You have a duplicate exercise squat`);
  });
});
