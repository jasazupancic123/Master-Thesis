import { TestApp } from '@test/common/utils/app.util';

import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeType } from '@src/attribute/enum/attribute-type.enum';
import { generateAttributeStub } from '@src/attribute/mock/attribute.stub';
import { generateAttributeValueStub } from '@src/attribute/mock/attribute-value.stub';
import type { TestInstitution } from '@src/common/type/entity.type';
import { GLOBAL_EXERCISE_OWNER } from '@src/exercise/constant/global-exercise-owner.constant';
import type { CreateExerciseDto } from '@src/exercise/dto/create-exercise.dto';
import { generateComponentStub } from '@src/exercise/mock/component.stub';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { TestDbService } from '@src/test-db/test-db.service';

jest.mock('@src/exercise/constant/components.constant', () => {
  const {
    generateComponentStub,
  } = require('@src/exercise/mock/component.stub');
  const {
    generateAttributeStub,
  } = require('@src/attribute/mock/attribute.stub');

  const attribute = generateAttributeStub();
  const root = generateComponentStub({
    field: 'c1',
    attributes: [attribute.field as string],
    params: ['reps', 'loadKg'],
    options: [generateComponentStub({ field: 'leaf1' })],
  });

  const warmup = generateComponentStub({ field: 'warmup' });
  const cooldown = generateComponentStub({ field: 'cooldown' });

  return {
    WARMUP_ID: 'warmup',
    COOLDOWN_ID: 'cooldown',
    WARMUP: warmup,
    COOLDOWN: cooldown,
    Components: [warmup, root, cooldown],
  };
});

describe('Create Exercise (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let exerciseAttributeService: ExerciseAttributeService;

  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    exerciseAttributeService = testApp.module.get(ExerciseAttributeService);
    institution = await db.institutions.createTest();
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(input: CreateExerciseDto, token: string) {
    return await testApp.http.post('/exercise', token, input);
  }

  it('should create a new exercise for a valid institution', async () => {
    const exercise = generateExerciseStub({
      name: 'New Exercise',
      components: ['c1:leaf1'],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
    });

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(201);
    expect(response.body.id).toBe(
      `new-exercise-${institution.id.toLowerCase()}`,
    );
    expect(response.body.name).toBe(exercise.name);
    expect(response.body.ownerId).toBe(global.manager.uid);
    expect(response.body.institutionId).toBe(institution.id);

    await db.exercises.delete(response.body.id);
  });

  it('should fail if the component does not exist', async () => {
    const exercise = generateExerciseStub({
      name: 'Invalid Exercise',
      components: ['non-existent-component-id'],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
    });

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'Value "non-existent-component-id" for attribute "Components" is not a valid option',
    );
  });

  it('should fail if the selected component is not a leaf', async () => {
    // Assuming `component` is not a leaf in this test scenario
    const exercise = generateExerciseStub({
      name: 'Invalid Leaf Exercise',
      components: ['c1'],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
    });

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(400); // Should return 400 if the component is not a leaf
    expect(response.body.message).toBe(
      `Option "c1" has nested options, please select one of the following: leaf1`,
    );
  });

  it('should create a global exercise for an admin user', async () => {
    const exercise = generateExerciseStub({
      name: 'Global Exercise',
      components: ['c1:leaf1'],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is a global exercise.',
    });

    const response = await req(exercise, global.admin.token);
    expect(response.status).toBe(201);
    expect(response.body.id).toBe(`global-exercise`);
    expect(response.body.name).toBe(exercise.name);
    expect(response.body.ownerId).toBe(GLOBAL_EXERCISE_OWNER); // Should be global owner

    await db.exercises.delete(response.body.id);
  });

  it('should validate attributes before creating the exercise', async () => {
    const invalidAttributes = [
      { field: 'a', value: 'some value' },
      { field: 'b', value: 'some value' },
      { field: 'c', value: 'some value' },
    ];

    const exercise = generateExerciseStub({
      name: 'Invalid Attribute Exercise',
      components: ['c1:leaf1'],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is an exercise.',
    });

    exerciseAttributeService.getAttributes = jest.fn().mockReturnValue([
      {
        field: 'a',
        name: 'Attribute A',
        type: AttributeType.String,
      },
      {
        field: 'b',
        name: 'Attribute B',
        type: AttributeType.Number,
      },
      {
        field: 'c',
        name: 'Attribute C',
        type: AttributeType.Boolean,
      },
    ] as Attribute[]);

    exerciseAttributeService.getValues = jest
      .fn()
      .mockReturnValue(invalidAttributes);

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Value for attribute "Attribute B" must be a number',
    );
  });

  it('should pass with all possible attribute types', async () => {
    const attributes = await Promise.all([
      generateAttributeStub({ field: 'str', type: AttributeType.String }),
      generateAttributeStub({ field: 'num', type: AttributeType.Number }),
      generateAttributeStub({ field: 'bool', type: AttributeType.Boolean }),
      generateAttributeStub({
        field: 'select',
        type: AttributeType.Select,
        options: [
          generateAttributeStub({ field: 'opt1', type: AttributeType.Value }),
          generateAttributeStub({ field: 'opt2', type: AttributeType.Value }),
        ],
      }),
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
      generateAttributeStub({
        field: 'multiselect',
        type: AttributeType.Multiselect,
        options: [
          generateAttributeStub({ field: 'optA', type: AttributeType.Value }),
          generateAttributeStub({ field: 'optB', type: AttributeType.Value }),
        ],
      }),
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
    ]);

    const component = generateComponentStub({
      attributes: attributes.map((attr) => attr.field) as string[],
    });

    jest
      .spyOn(exerciseAttributeService, 'getRootMainComponent')
      .mockImplementationOnce(() => component);

    const exercise = generateExerciseStub({ components: [component.field] });
    exerciseAttributeService.getAttributes = jest
      .fn()
      .mockReturnValue(attributes);

    exerciseAttributeService.getValues = jest.fn().mockReturnValue([
      generateAttributeValueStub({ field: 'str', value: 'string-value' }),
      generateAttributeValueStub({ field: 'num', value: '10' }),
      generateAttributeValueStub({ field: 'bool', value: 'true' }),
      generateAttributeValueStub({
        field: 'select',
        value: 'opt1',
        selected: 'opt1',
      }),
      generateAttributeValueStub({
        field: 'nested-select',
        value: '10',
        selected: 'nested-select-opt1:nested-select-opt1-num',
      }),
      generateAttributeValueStub({
        field: 'multiselect',
        value: 'optA',
        selected: 'optA',
      }),
      generateAttributeValueStub({
        field: 'nested-multiselect',
        value: 'true',
        selected: 'nested-multiselect-opt1:nested-multiselect-opt2-bool',
      }),
      generateAttributeValueStub({
        field: 'nested-multiselect',
        value: '123',
        selected: 'nested-multiselect-opt1:nested-multiselect-opt1-num',
      }),
    ]);

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(201);

    await db.exercises.delete(response.body.id);
  });

  it('should fail if a required attribute is missing', async () => {
    const attribute = generateAttributeStub({
      required: true,
      type: AttributeType.String,
      name: 'is-required',
    });

    const component = generateComponentStub({
      attributes: [attribute.field as string],
    });

    jest
      .spyOn(exerciseAttributeService, 'getRootMainComponent')
      .mockImplementationOnce(() => component);

    const exercise = generateExerciseStub({ components: [component.field] });
    exerciseAttributeService.getValues = jest.fn().mockReturnValueOnce([]);
    exerciseAttributeService.getAttributes = jest
      .fn()
      .mockReturnValueOnce([attribute]);

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      `Attribute "${attribute.name}" is required`,
    );
  });

  it('should create disabled exercise for an admin user', async () => {
    const exercise = generateExerciseStub({
      name: 'Disabled Exercise',
      components: ['c1:leaf1'],
      videoUrl: 'http://example.com/video',
      imageUrl: 'http://example.com/image',
      instruction: 'This is a disabled exercise.',
      disabled: true,
    });

    exerciseAttributeService.getValues = jest.fn().mockReturnValueOnce([]);
    exerciseAttributeService.getAttributes = jest.fn().mockReturnValueOnce([]);

    const response = await req(exercise, global.admin.token);
    expect(response.status).toBe(201);
    expect(response.body.id).toBe(`disabled-exercise`);
    expect(response.body.name).toBe(exercise.name);
    expect(response.body.ownerId).toBe(GLOBAL_EXERCISE_OWNER); // Should be global owner
    expect(response.body.disabled).toBe(true);

    const fetched = await db.exercises.findById(response.body.id);
    expect(fetched?.disabled).toBe(true);

    await db.exercises.delete(response.body.id);
  });

  it.each([['manager', global.manager.token]])(
    'should not allow %s to create disabled exercise',
    async (_role, token) => {
      const exercise = generateExerciseStub({
        name: 'Disabled Exercise',
        components: ['c1:leaf1'],
        videoUrl: 'http://example.com/video',
        imageUrl: 'http://example.com/image',
        instruction: 'This is a disabled exercise.',
        disabled: true,
      });

      const response = await req(exercise, token);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'You cannot create disabled exercises',
      );
    },
  );

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

  it('should create bilateral exercise and populate correct params', async () => {
    const exercise = generateExerciseStub({
      name: 'Bilateral Exercise',
      components: ['c1:leaf1'],
      isUnilateral: false,
    });

    exerciseAttributeService.getValues = jest.fn().mockReturnValueOnce([]);
    exerciseAttributeService.getAttributes = jest.fn().mockReturnValueOnce([]);

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe(exercise.name);

    const found = await db.exercises.findById(response.body.id);
    expect(found?.isUnilateral).toBe(false);
    expect(found?.params).toEqual(expect.arrayContaining(['reps', 'loadKg']));

    await db.exercises.delete(response.body.id);
  });

  it('should create unilateral exercise and populate correct params', async () => {
    const exercise = generateExerciseStub({
      name: 'Unilateral Exercise',
      components: ['c1:leaf1'],
      isUnilateral: true,
    });

    exerciseAttributeService.getValues = jest.fn().mockReturnValueOnce([]);
    exerciseAttributeService.getAttributes = jest.fn().mockReturnValueOnce([]);

    const response = await req(exercise, global.manager.token);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe(exercise.name);

    const found = await db.exercises.findById(response.body.id);
    expect(found?.isUnilateral).toBe(true);
    expect(found?.params).toEqual(
      expect.arrayContaining(['reps', 'loadKg', 'repsR', 'loadKgR']),
    );

    await db.exercises.delete(response.body.id);
  });
});
