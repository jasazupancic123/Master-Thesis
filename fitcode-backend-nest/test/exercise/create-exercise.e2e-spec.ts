import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { generateAttributeStub } from '@src/attribute/mock/attribute.stub';
import { generateExerciseAttributeValueStub } from '@src/attribute/mock/attribute-value.stub';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { AttributeType } from '@src/common/enum/attribute-type.enum';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { GLOBAL_EXERCISE_OWNER } from '@src/exercise/constant/global-exercise-owner.constant';
import type { ExerciseAttributeValue } from '@src/exercise/entity/exercise-attribute-value.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';

import type { TestInstitution } from '../common/type/entity.type';
import {
  createInstitution,
  deleteCollection,
  deleteDoc,
  deleteDocs,
  deleteInstitution,
} from '../common/utils/data.util';

describe('Create Exercise (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let attributeService: AttributeService;
  let componentService: ComponentService;
  let institutionService: InstitutionService;

  let root: Component;
  let leaf: Component;
  let institution: TestInstitution;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    attributeService = moduleFixture.get(AttributeService);
    componentService = moduleFixture.get(ComponentService);
    institutionService = moduleFixture.get(InstitutionService);

    const attribute = await attributeService.create(generateAttributeStub());
    root = await componentService.create(
      generateComponentStub({ attributes: [attribute.field] }),
    );

    leaf = await componentService.create(
      generateComponentStub({ parentId: root.id }),
    );

    institution = await createInstitution(institutionService);
  });

  afterAll(async () => {
    await Promise.all([
      deleteDocs(firebase, 'COMPONENT', [leaf.id, root.id]),
      deleteCollection(firebase, 'ATTRIBUTE'),
      deleteInstitution(firebase, institution),
    ]);

    await app.close();
  });

  it('should create a new exercise for a valid institution', async () => {
    const exercise = generateExerciseStub({
      name: 'New Exercise',
      componentIds: [leaf.id],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send(exercise);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(exercise.name);
    expect(response.body.ownerId).toBe(institution.id);

    await deleteDoc(firebase, 'EXERCISE', response.body.id);
  });

  it('should fail if the component does not exist', async () => {
    const exercise = generateExerciseStub({
      name: 'Invalid Exercise',
      componentIds: ['non-existent-component-id'],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${global.manager.token}`)
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
      componentIds: [root.id],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send(exercise);

    expect(response.status).toBe(400); // Should return 400 if the component is not a leaf
    expect(response.body.message).toBe(
      `Main component ${root.name.toLowerCase()} is not valid for an exercise`,
    );
  });

  it('should create a global exercise for an admin user', async () => {
    const exercise = generateExerciseStub({
      name: 'Global Exercise',
      componentIds: [leaf.id],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is a global exercise.',
      attributeValues: [],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${global.admin.token}`)
      .send(exercise);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(exercise.name);
    expect(response.body.ownerId).toBe(GLOBAL_EXERCISE_OWNER); // Should be global owner

    await deleteDoc(firebase, 'EXERCISE', response.body.id);
  });

  it('should validate attributes before creating the exercise', async () => {
    const invalidAttributes = [
      { field: 'a', value: 'some value' },
      { field: 'b', value: 'some value' },
      { field: 'c', value: 'some value' },
    ];

    const exercise = generateExerciseStub({
      name: 'Invalid Attribute Exercise',
      componentIds: [leaf.id],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
      attributeValues: invalidAttributes as ExerciseAttributeValue[],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send(exercise);

    expect(response.status).toBe(201);
    expect(response.body.attributeValues).toEqual([]);

    await deleteDoc(firebase, 'EXERCISE', response.body.id);
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

    const exercise = generateExerciseStub({
      componentIds: [component.id],
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
          selected: 'nested-select-opt1:nested-select-opt1-num',
        }),
        generateExerciseAttributeValueStub({
          field: 'multiselect',
          value: 'optA',
          selected: 'optA',
        }),
        generateExerciseAttributeValueStub({
          field: 'nested-multiselect',
          value: 'true',
          selected: 'nested-multiselect-opt1:nested-multiselect-opt2-bool',
        }),
        generateExerciseAttributeValueStub({
          field: 'nested-multiselect',
          value: '123',
          selected: 'nested-multiselect-opt1:nested-multiselect-opt1-num',
        }),
      ],
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send(exercise);

    expect(response.status).toBe(201);

    await Promise.all([
      deleteDoc(firebase, 'EXERCISE', response.body.id),
      deleteDoc(firebase, 'COMPONENT', component.id),
      deleteCollection(firebase, 'ATTRIBUTE'),
    ]);
  });

  it('should fail if a required attribute is missing', async () => {
    const attribute = await attributeService.create(
      generateAttributeStub({
        required: true,
        type: AttributeType.String,
        name: 'is-required',
      }),
    );

    const component = await componentService.create(
      generateComponentStub({ attributes: [attribute.field] }),
    );

    const exercise = generateExerciseStub({
      componentIds: [component.id],
      attributeValues: [], // No attributes provided
    });

    const response = await request(app.getHttpServer())
      .post('/exercise')
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send(exercise);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      `Attribute "${attribute.name}" is required`,
    );

    await Promise.all([
      deleteDoc(firebase, 'COMPONENT', component.id),
      deleteDoc(firebase, 'ATTRIBUTE', attribute.field),
    ]);
  });

  it('should fail to create many exercises if something is wrong', async () => {
    const exercises = [
      generateExerciseStub({
        componentIds: ['non-existing-component'],
        attributeValues: [generateExerciseAttributeValueStub()],
      }),
      generateExerciseStub({ componentIds: [root.id] }),
    ];

    const response = await request(app.getHttpServer())
      .post('/exercise/many')
      .set('Authorization', `Bearer ${global.manager.token}`)
      .send({ exercises });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      `Component non-existing-component does not exist`,
    );
  });

  /* it('should not create more exercises than the limit for user', async () => {
    await firebaseService.deleteCollection(FirestoreCollection.EXERCISE);
    const component = await componentService.create(generateComponentStub());

    const exercises = Array.from({ length: NUM_MAX_EXERCISES + 10 }).map((_) =>
      generateExerciseStub({ componentIds: [component.id] }),
    );

    const response = await request(app.getHttpServer())
      .post('/exercise/many')
      .set('Authorization', `Bearer ${institution.token}`)
      .send({ exercises });

    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(NUM_MAX_EXERCISES); // trainer has 5 exercises from previous test
  }); */
});
