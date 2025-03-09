import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { Exercise } from '../../src/exercise/entity/exercise.entity';
import { UserService } from '../../src/user/user.service';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import { generateExerciseStub } from '../mock/exercise.stub';
import { Component } from '../../src/component/entity/component.entity';
import { ComponentService } from '../../src/component/component.service';
import { generateAttributeStub } from '../mock/attribute.stub';
import { generateComponentStub } from '../mock/component.stub';
import { BodyRegion } from '../../src/exercise/enum/body-region';
import { GLOBAL_EXERCISE_OWNER } from '../../src/exercise/constant/global-exercise-owner.constant';
import { AttributeType } from '../../src/common/enum/attribute-type.enum';
import { CacheManagerService } from '../../src/cache-manager/cache-manager.service';
import { ExerciseAttributeValue } from '../../src/exercise/entity/exercise-attribute-value.entity';

describe('Create Exercise (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let exerciseService: ExerciseService;
  let attributeService: AttributeService;
  let componentService: ComponentService;
  let cacheManagerService: CacheManagerService;

  let root: Component;
  let leaf: Component;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    exerciseService = moduleFixture.get(ExerciseService);
    attributeService = moduleFixture.get(AttributeService);
    componentService = moduleFixture.get(ComponentService);
    cacheManagerService = moduleFixture.get(CacheManagerService);

    const attribute = await attributeService.create(generateAttributeStub());
    root = await componentService.create(
      generateComponentStub({ attributes: [attribute.field] }),
    );

    leaf = await componentService.create(
      generateComponentStub({ parentId: root.id }),
    );
  });

  afterAll(async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    await app.close();
  });

  it('should create a new exercise for a valid trainer', async () => {
    const exercise = generateExerciseStub({
      name: 'New Exercise',
      componentId: leaf.id,
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      region: BodyRegion.UpperBody,
      coordination: true,
      equipment: ['dumbbells'],
      instruction: 'This is an exercise.',
      tags: ['strength', 'muscle'],
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(exercise);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(exercise.name);
    expect(response.body.ownerId).toBe(trainer.uid);
  });

  it('should fail if the component does not exist', async () => {
    const exercise = generateExerciseStub({
      name: 'Invalid Exercise',
      componentId: 'non-existent-component-id',
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      region: BodyRegion.UpperBody,
      coordination: true,
      equipment: ['dumbbells'],
      instruction: 'This is an exercise.',
      tags: ['strength', 'muscle'],
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(exercise);

    expect(response.status).toBe(404); // Should return 404 if component doesn't exist
    expect(response.body.message).toBe(
      'Component non-existent-component-id does not exist',
    );
  });

  it('should fail if the selected component is not a leaf', async () => {
    // Assuming `component` is not a leaf in this test scenario
    const exercise = generateExerciseStub({
      name: 'Invalid Leaf Exercise',
      componentId: root.id,
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      region: BodyRegion.UpperBody,
      coordination: true,
      equipment: ['dumbbells'],
      instruction: 'This is an exercise.',
      tags: ['strength', 'muscle'],
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(exercise);

    expect(response.status).toBe(400); // Should return 400 if the component is not a leaf
    expect(response.body.message).toBe(
      `Component ${root.name.toLowerCase()} is invalid for selection`,
    );
  });

  it('should create a global exercise for an admin user', async () => {
    const exercise = generateExerciseStub({
      name: 'Global Exercise',
      componentId: leaf.id,
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      region: BodyRegion.LowerBody,
      coordination: false,
      equipment: ['barbell'],
      instruction: 'This is a global exercise.',
      tags: ['strength', 'core'],
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(exercise);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(exercise.name);
    expect(response.body.ownerId).toBe(GLOBAL_EXERCISE_OWNER); // Should be global owner
  });

  it('should validate attributes before creating the exercise', async () => {
    const invalidAttributes = [
      { field: 'a', value: 'some value' },
      { field: 'b', value: 'some value' },
      { field: 'c', value: 'some value' },
    ];

    const exercise = generateExerciseStub({
      name: 'Invalid Attribute Exercise',
      componentId: leaf.id,
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      region: BodyRegion.Core,
      coordination: true,
      equipment: ['dumbbells'],
      instruction: 'This is an exercise.',
      tags: ['strength', 'muscle'],
      attributeValues: invalidAttributes as ExerciseAttributeValue[],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(exercise);

    expect(response.status).toBe(201);
    expect(response.body.attributeValues).toEqual([]);
  });

  it('should fail if a required attribute is missing', async () => {
    const requiredAttribute = await attributeService.create(
      generateAttributeStub({ required: true, type: AttributeType.String }),
    );

    const component = await componentService.create(
      generateComponentStub({ attributes: [requiredAttribute.field] }),
    );

    cacheManagerService.clearComponents();
    const exercise = generateExerciseStub({
      componentId: component.id,
      attributeValues: [], // no attributes provided
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(exercise);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      `Attribute "${requiredAttribute.name}" is required`,
    );
  });
});
