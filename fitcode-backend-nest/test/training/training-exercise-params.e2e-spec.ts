import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { addDays } from 'date-fns';

import { AppModule } from '@src/app.module';
import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { generateExerciseAttributeValueStub } from '@src/attribute/mock/attribute-value.stub';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { ComponentService } from '@src/component/component.service';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import type { Component } from '@src/component/entity/component.entity';
import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '@src/component/enum/param.enum';
import type { ExerciseAttributeValue } from '@src/exercise/entity/exercise-attribute-value.entity';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { TrainingService } from '@src/training/service/training.service';

import { ATTRIBUTE_ENDURANCE_OPTIONS } from '../common/constant/attribute.constant';
import { COMPONENT_ENDURANCE } from '../common/constant/component.constant';
import type { TestInstitution } from '../common/type/entity.type';
import {
  createGroupWithCycles,
  createInstitution,
  deleteCollection,
  deleteDoc,
  deleteInstitution,
} from '../common/utils/data.util';

describe('Training Exercise Params (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let attributeService: AttributeService;
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

    firebase = moduleFixture.get(FirebaseService);
    attributeService = moduleFixture.get(AttributeService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    attribute = await attributeService.create(ATTRIBUTE_ENDURANCE_OPTIONS);
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
      deleteDoc(firebase, 'ATTRIBUTE', attribute.field),
    ]);

    await app.close();
  });

  async function createExercise(attributeValues: ExerciseAttributeValue[]) {
    return await exerciseService.create(
      global.admin,
      generateExerciseStub({ componentIds: [leaf.id], attributeValues }),
    );
  }

  async function createTraining(exerciseId: string) {
    return await trainingService.create(
      global.trainer,
      generateTrainingStub({
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
      }),
    );
  }

  describe('Warmup and cooldown components', () => {
    it('should not populate params', async () => {
      const exercise = await createExercise([]);
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
                exercises: [
                  generateTrainingExercise({ id: exercise.id, color: 'red' }),
                ],
              }),
            ],
          }),
          cooldown: generateTrainingComponent({
            id: COOLDOWN_COMPONENT_ID,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercise.id, color: 'red' }),
                ],
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

  describe('Endurance select attribute params test', () => {
    it('should keep default params since no attribute values are passed to exercise', async () => {
      const exercise = await createExercise([]);
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

    it('should populate end-opt-2 params for exercise', async () => {
      const exercise = await createExercise([
        generateExerciseAttributeValueStub({
          field: 'end-opts',
          value: 'end-opt-2',
        }),
      ]);

      const training = await createTraining(exercise.id);

      const params = training.components[0].supersets[0].exercises[0].params;

      // only vol1 (time, dist) and int1 (mas, hrmax, eff)
      expect(params).toEqual([
        expect.objectContaining({
          field: ParamType.VolWorkSets,
          options: [expect.objectContaining({ field: VolWorkSetType.Set })],
        }),
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
        expect.objectContaining({
          field: ParamType.VolRec1,
          options: [
            expect.objectContaining({ field: VolType.Time }),
            expect.objectContaining({ field: VolType.Dist }),
          ],
        }),
        expect.objectContaining({
          field: ParamType.IntRec1,
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

    it('should populate end-opt-3 params for exercise', async () => {
      const exercise = await createExercise([
        generateExerciseAttributeValueStub({
          field: 'end-opts',
          value: 'end-opt-3',
        }),
      ]);

      const training = await createTraining(exercise.id);

      const params = training.components[0].supersets[0].exercises[0].params;

      // only vol1 (time, dist) and int1 (mas, hrmax, eff)
      expect(params).toEqual([
        expect.objectContaining({
          field: ParamType.VolWorkSets,
          options: [expect.objectContaining({ field: VolWorkSetType.Set })],
        }),
        expect.objectContaining({
          field: ParamType.VolWork1,
          options: [
            expect.objectContaining({ field: VolType.Time }),
            expect.objectContaining({ field: VolType.Dist }),
          ],
        }),
        expect.objectContaining({
          field: ParamType.VolWork2,
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
        expect.objectContaining({
          field: ParamType.IntWork2,
          options: [
            expect.objectContaining({ field: IntType.Mas }),
            expect.objectContaining({ field: IntType.Hrmax }),
            expect.objectContaining({ field: IntType.Eff }),
          ],
        }),
        expect.objectContaining({
          field: ParamType.VolRec1,
          options: [
            expect.objectContaining({ field: VolType.Time }),
            expect.objectContaining({ field: VolType.Dist }),
          ],
        }),
        expect.objectContaining({
          field: ParamType.IntRec1,
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

    it('should populate end-opt-4 params for exercise', async () => {
      const exercise = await createExercise([
        generateExerciseAttributeValueStub({
          field: 'end-opts',
          value: 'end-opt-4',
        }),
      ]);

      const training = await createTraining(exercise.id);

      const params = training.components[0].supersets[0].exercises[0].params;

      // only vol1 (time, dist) and int1 (mas, hrmax, eff)
      expect(params).toEqual([
        expect.objectContaining({
          field: ParamType.VolWorkSets,
          options: [expect.objectContaining({ field: VolWorkSetType.Set })],
        }),
        expect.objectContaining({
          field: ParamType.VolWork1,
          options: [expect.objectContaining({ field: VolType.Rep })],
        }),
        expect.objectContaining({
          field: ParamType.VolWork2,
          options: [
            expect.objectContaining({ field: VolType.Time }),
            expect.objectContaining({ field: VolType.Dist }),
          ],
        }),
        expect.objectContaining({
          field: ParamType.IntWork2,
          options: [
            expect.objectContaining({ field: IntType.Mas }),
            expect.objectContaining({ field: IntType.Hrmax }),
            expect.objectContaining({ field: IntType.Eff }),
          ],
        }),
        expect.objectContaining({
          field: ParamType.VolRec1,
          options: [
            expect.objectContaining({ field: VolType.Time }),
            expect.objectContaining({ field: VolType.Dist }),
          ],
        }),
        expect.objectContaining({
          field: ParamType.IntRec1,
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
  });
});
