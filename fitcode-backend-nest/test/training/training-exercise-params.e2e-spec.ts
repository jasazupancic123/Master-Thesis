import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ComponentService } from '../../src/component/component.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { Group } from '../../src/group/entity/group.entity';
import { GroupService } from '../../src/group/group.service';
import { Institution } from '../../src/institution/entity/institution.entity';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { TrainingService } from '../../src/training/service/training.service';
import {
  createInstitution,
  createGroupWithCycles,
  deleteDoc,
  deleteCollection,
} from '../common/utils/data.util';
import { COMPONENT_ENDURANCE } from '../common/constant/component.constant';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { ATTRIBUTE_ENDURANCE_OPTIONS } from '../common/constant/attribute.constant';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../../src/component/enum/param.enum';
import { Attribute } from '../../src/attribute/entity/attribute.entity';
import { Component } from '../../src/component/entity/component.entity';
import { ExerciseAttributeValue } from '../../src/exercise/entity/exercise-attribute-value.entity';
import { generateExerciseAttributeValueStub } from '../../src/attribute/mock/attribute-value.stub';

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
  let institution: Institution;
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
    group = await createGroupWithCycles(groupService, {
      institutionId: institution.id,
    });
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteCollection(firebase, 'COMPONENT'),
      deleteDoc(firebase, 'ATTRIBUTE', attribute.field),
    ]);

    await app.close();
  });
  async function createExercise(attributeValues: ExerciseAttributeValue[]) {
    return await exerciseService.create(
      admin,
      generateExerciseStub({ componentIds: [leaf.id], attributeValues }),
    );
  }

  async function createTraining(componentId: string, exerciseId: string) {
    return await trainingService.create(
      trainer,
      generateTrainingStub({
        institutionId: institution.id,
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: componentId,
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

  describe('Endurance select attribute params test', () => {
    it('should keep default params since no attribute values are passed to exercise', async () => {
      const exercise = await createExercise([]);
      const training = await createTraining(
        COMPONENT_ENDURANCE.id,
        exercise.id,
      );

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

      const training = await createTraining(
        COMPONENT_ENDURANCE.id,
        exercise.id,
      );

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

      const training = await createTraining(
        COMPONENT_ENDURANCE.id,
        exercise.id,
      );

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

      const training = await createTraining(
        COMPONENT_ENDURANCE.id,
        exercise.id,
      );

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
