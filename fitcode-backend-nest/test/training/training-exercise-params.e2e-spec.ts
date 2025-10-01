import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { addDays } from 'date-fns';

import { AppModule } from '@src/app.module';
import type { Attribute } from '@src/attribute/entity/attribute.entity';
import type { TestInstitution } from '@src/common/type/entity.type';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
  deleteInstitution,
} from '@src/common/utils/data.util';
import { ComponentService } from '@src/component/component.service';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import type { Exercise } from '@src/exercise/entity/exercise.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { TestDbService } from '@src/test-db/test-db.service';
import { IntType, ParamType, VolType } from '@src/training/enum/load-type.enum';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';

import { COMPONENT_ENDURANCE } from '../common/constant/component.constant';

describe('Training Exercise Params (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let institutionService: InstitutionService;

  let attribute: Attribute;
  let leaf: Component;
  let institution: TestInstitution;
  let group: Group;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    await componentService.createFromTree(COMPONENT_ENDURANCE);
    const flat = await componentService.findAllFlat();
    leaf = componentService.leafsFromFlat(flat)[0];

    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'GROUP', group.id),
      deleteInstitution(firebase, institution),
      deleteCollection(firebase, 'COMPONENT'),
      deleteCollection(firebase, 'EXERCISE'),
      deleteCollection(firebase, 'TRAINING'),
    ]);

    await app.close();
  });

  async function createExercise(data: Partial<Exercise> = {}) {
    return await exerciseService.create(
      global.admin,
      generateExerciseStub({
        componentIds: data.componentIds || [leaf.id],
        ...data,
      }),
    );
  }

  async function createTraining(exerciseId: string, componentId?: string) {
    const trainingId = await db.trainings.save(
      generateTrainingStub({
        ownerId: global.trainer.id,
        membersIds: [global.athlete.id],
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        date: addDays(new Date(), 2),
        components: [
          generateTrainingComponent({
            id: COMPONENT_ENDURANCE.id,
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: exerciseId })],
              }),
            ],
          }),
        ],
        warmup: generateTrainingComponent({
          id: WARMUP_COMPONENT_ID,
          supersets: [
            generateSuperset({
              exercises: [generateTrainingExercise({ id: exerciseId })],
            }),
          ],
        }),
        cooldown: generateTrainingComponent({
          id: COOLDOWN_COMPONENT_ID,
          supersets: [
            generateSuperset({
              exercises: [generateTrainingExercise({ id: exerciseId })],
            }),
          ],
        }),
      }),
    );

    const training = await db.trainings.findById(trainingId);

    // populate params through service
    return await trainingService.update(
      global.trainer,
      { trainingId: training.id },
      {
        ...training,
        components: [
          generateTrainingComponent({
            id: componentId || COMPONENT_ENDURANCE.id,
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: exerciseId })],
              }),
            ],
          }),
        ],
      },
    );
  }

  describe('Warmup and cooldown components', () => {
    it('should not populate params', async () => {
      const exercise = await createExercise();
      const training = await createTraining(exercise.id);

      const updated = await trainingService.update(
        global.trainer,
        { trainingId: training.id },
        {
          ...training,
          warmup: generateTrainingComponent({
            id: WARMUP_COMPONENT_ID,
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: exercise.id })],
              }),
            ],
          }),
          cooldown: generateTrainingComponent({
            id: COOLDOWN_COMPONENT_ID,
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: exercise.id })],
              }),
            ],
          }),
        },
      );

      const warmupParams = updated.warmup.supersets[0].exercises[0].params;
      const cooldownParams = updated.cooldown.supersets[0].exercises[0].params;

      expect(warmupParams).toHaveLength(0);
      expect(cooldownParams).toHaveLength(0);

      await Promise.all([
        deleteDoc(firebase, 'TRAINING', updated.id),
        deleteDoc(firebase, 'EXERCISE', exercise.id),
      ]);
    });
  });

  it('should keep default params since no attribute values are passed to exercise', async () => {
    const exercise = await createExercise();
    const training = await createTraining(exercise.id);
    const params = training.components[0].supersets[0].exercises[0].params;

    // only vol1 (time, dist) and int1 (mas, hrmax, eff)
    expect(params).toEqual([
      expect.objectContaining({
        field: ParamType.VolWork1,
        options: [
          expect.objectContaining({ field: VolType.Time }),
          expect.objectContaining({ field: VolType.Dist }),
        ],
      }),
      expect.objectContaining({
        field: ParamType.IntWork1,
        options: [
          expect.objectContaining({ field: IntType.Mas }),
          expect.objectContaining({ field: IntType.Hrmax }),
          expect.objectContaining({ field: IntType.Eff }),
        ],
      }),
    ]);

    await Promise.all([
      deleteDoc(firebase, 'TRAINING', training.id),
      deleteDoc(firebase, 'EXERCISE', exercise.id),
    ]);
  });

  it('should apply different attributes if there is no equipment', async () => {
    const component = await componentService.create(
      generateComponentStub({
        params: {
          default: [{ field: 'int1', options: [{ field: 'kg' }] }],
          'equipment:!': [{ field: 'int1', options: [{ field: 'bw' }] }],
        },
      }),
    );

    const exerciseWithEquipment = await createExercise({
      componentIds: [component.id],
      equipment: ['strength:barbells:olympic'],
    });

    const exerciseWithoutEquipment = await createExercise({
      componentIds: [component.id],
      equipment: [],
    });

    const training1 = await createTraining(
      exerciseWithEquipment.id,
      component.id,
    );

    const training2 = await createTraining(
      exerciseWithoutEquipment.id,
      component.id,
    );

    const params1 = training1.components[0].supersets[0].exercises[0].params;
    const params2 = training2.components[0].supersets[0].exercises[0].params;

    expect(params1).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: ParamType.IntWork1,
          options: [expect.objectContaining({ field: IntType.Kg })],
        }),
      ]),
    );

    expect(params1).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          field: ParamType.IntWork1,
          options: [expect.objectContaining({ field: IntType.Bw })],
        }),
      ]),
    );

    expect(params2).toEqual([
      expect.objectContaining({
        field: ParamType.IntWork1,
        options: [expect.objectContaining({ field: IntType.Bw })],
      }),
    ]);

    expect(params2).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          field: ParamType.IntWork1,
          options: [expect.objectContaining({ field: IntType.Kg })],
        }),
      ]),
    );
  });
});
