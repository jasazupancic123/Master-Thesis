import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';

describe('Create Many Exercises (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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
      .set('Authorization', `Bearer ${global.admin.token}`)
      .send({ exercises });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(`You have a duplicate exercise squat`);
  });
});
