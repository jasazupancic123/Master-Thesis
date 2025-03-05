import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { CommonService } from '../src/common/service/common.service';
import { FirebaseService } from 'src/firebase/firebase.service';

describe('ExerciseController (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let configService: ConfigService;
  let commonService: CommonService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services
    firebaseService = moduleFixture.get(FirebaseService);
    configService = moduleFixture.get(ConfigService);
    commonService = moduleFixture.get(CommonService);
  });

  afterAll(async () => await app.close());

  it('should return all exercises for a user', async () => {
    // Create a test user in the Firebase Auth Emulator
    const testUser = await firebaseService.auth.createUser({
      email: 'test@example.com',
      password: 'password',
    });

    // Generate a custom token for the test user
    const customToken = await firebaseService.auth.createCustomToken(
      testUser.uid,
    );

    // Exchange the custom token for an ID token
    const idToken = await fetch(
      'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      },
    )
      .then((res) => res.json())
      .then((data) => data.idToken);

    // Create some test exercises for the user
    await request(app.getHttpServer())
      .post('/exercise/many')
      .set('Authorization', `Bearer ${idToken}`)
      .send({
        exercises: [
          { name: 'Bench Press', muscleGroup: 'chest' },
          { name: 'Deadlift', muscleGroup: 'back' },
        ],
      });

    // Test the GET /exercise endpoint
    const response = await request(app.getHttpServer())
      .get('/exercise')
      .set('Authorization', `Bearer ${idToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Bench Press', muscleGroup: 'chest' }),
        expect.objectContaining({ name: 'Deadlift', muscleGroup: 'back' }),
      ]),
    );

    // Clean up the test user
    await firebaseService.auth.deleteUser(testUser.uid);
  });
});
