import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
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
import { generateExerciseAttributeValueStub } from '../mock/attribute-value.stub';
import { NUM_MAX_EXERCISES } from '../../src/common/constant/limit.constant';

describe('Create Exercise (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
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

  it('should pass with all possible attribute types', async () => {
    const attributes = await Promise.all([
      attributeService.create(
        generateAttributeStub({ field: 'str', type: AttributeType.String }),
      ),
      attributeService.create(
        generateAttributeStub({ field: 'num', type: AttributeType.Number }),
      ),
      attributeService.create(
        generateAttributeStub({ field: 'bool', type: AttributeType.Boolean }),
      ),
      attributeService.create(
        generateAttributeStub({
          field: 'select',
          type: AttributeType.Select,
          options: [
            generateAttributeStub({ field: 'opt1', type: AttributeType.Value }),
            generateAttributeStub({ field: 'opt2', type: AttributeType.Value }),
          ],
        }),
      ),
      attributeService.create(
        generateAttributeStub({
          field: 'nested-select',
          type: AttributeType.Select,
          options: [
            generateAttributeStub({
              field: 'nested-select-opt1',
              type: AttributeType.Select,
              options: [
                generateAttributeStub({
                  field: 'nested-select-opt1-num',
                  type: AttributeType.Number,
                }),
                generateAttributeStub({
                  field: 'nested-select-opt2-bool',
                  type: AttributeType.Boolean,
                }),
              ],
            }),
          ],
        }),
      ),
      attributeService.create(
        generateAttributeStub({
          field: 'multiselect',
          type: AttributeType.Multiselect,
          options: [
            generateAttributeStub({ field: 'optA', type: AttributeType.Value }),
            generateAttributeStub({ field: 'optB', type: AttributeType.Value }),
          ],
        }),
      ),
      attributeService.create(
        generateAttributeStub({
          field: 'nested-multiselect',
          type: AttributeType.Multiselect,
          options: [
            generateAttributeStub({
              field: 'nested-multiselect-opt1',
              type: AttributeType.Select,
              options: [
                generateAttributeStub({
                  field: 'nested-multiselect-opt1-num',
                  type: AttributeType.Number,
                }),
                generateAttributeStub({
                  field: 'nested-multiselect-opt2-bool',
                  type: AttributeType.Boolean,
                }),
              ],
            }),
          ],
        }),
      ),
    ]);

    const component = await componentService.create(
      generateComponentStub({
        attributes: attributes.map((attr) => attr.field),
      }),
    );

    cacheManagerService.clearComponents();
    const exercise = generateExerciseStub({
      componentId: component.id,
      attributeValues: [
        generateExerciseAttributeValueStub({
          field: 'str',
          value: 'string-value',
        }),
        generateExerciseAttributeValueStub({
          field: 'num',
          value: '10',
        }),
        generateExerciseAttributeValueStub({
          field: 'bool',
          value: 'true',
        }),
        generateExerciseAttributeValueStub({
          field: 'select',
          value: 'opt1',
          selected: 'opt1',
        }),
        generateExerciseAttributeValueStub({
          field: 'nested-select',
          value: '10',
          selected: 'nested-select-opt1.nested-select-opt1-num',
        }),
        generateExerciseAttributeValueStub({
          field: 'multiselect',
          value: 'optA',
          selected: 'optA',
        }),
        generateExerciseAttributeValueStub({
          field: 'nested-multiselect',
          value: 'true',
          selected: 'nested-multiselect-opt1.nested-multiselect-opt2-bool',
        }),
        generateExerciseAttributeValueStub({
          field: 'nested-multiselect',
          value: '123',
          selected: 'nested-multiselect-opt1.nested-multiselect-opt1-num',
        }),
      ],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(exercise);

    expect(response.status).toBe(201);
  });

  it('should fail if a required attribute is missing', async () => {
    const attribute = await attributeService.create(
      generateAttributeStub({ required: true, type: AttributeType.String }),
    );

    const component = await componentService.create(
      generateComponentStub({ attributes: [attribute.field] }),
    );

    cacheManagerService.clearComponents();
    const exercise = generateExerciseStub({
      componentId: component.id,
      attributeValues: [], // No attributes provided
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(exercise);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      `Attribute "${attribute.name}" is required`,
    );
  });

  it('should fail to create many exercises if something is wrong', async () => {
    const exercises = [
      generateExerciseStub({
        componentId: 'non-existing-component',
        attributeValues: [generateExerciseAttributeValueStub()],
      }),
      generateExerciseStub({ componentId: root.id }),
    ];

    const response = await request(app.getHttpServer())
      .post('/exercise/many')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send({ exercises });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      `Component non-existing-component does not exist`,
    );
  });

  it('should not create more exercises than the limit for user', async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    const component = await componentService.create(generateComponentStub());

    cacheManagerService.clearComponents();
    const exercises = Array.from({ length: NUM_MAX_EXERCISES + 10 }).map((_) =>
      generateExerciseStub({ componentId: component.id }),
    );

    const response = await request(app.getHttpServer())
      .post('/exercise/many')
      .set('Authorization', `Bearer ${trainer.token}`)
      .send({ exercises });

    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(NUM_MAX_EXERCISES); // trainer has 5 exercises from previous test
  });
});
