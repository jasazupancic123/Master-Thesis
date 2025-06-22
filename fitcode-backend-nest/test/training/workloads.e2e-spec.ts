import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { ComponentService } from '../../src/component/component.service';
import { Component } from '../../src/component/entity/component.entity';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { TrainingService } from '../../src/training/service/training.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import {
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '../../src/training/mock/training.stub';
import { generateExerciseStub } from '../../src/exercise/mock/exercise.stub';
import { createGroupWithCycles } from '../utils/data.util';
import {
  DEFAULT_PARAMS_KEY,
  INT_OPTIONS,
  PARAMS,
  VOL_OPTIONS,
} from '../../src/component/constant/param.constant';
import {
  IntType,
  ParamType,
  VolType,
} from '../../src/component/enum/param.enum';
import { WorkloadService } from '../../src/training/service/workload.service';
import { createAthleteUserAndToken } from '../utils/auth.util';
import { AttributeType } from '../../src/common/enum/attribute-type.enum';
import { Workload } from '../../src/training/entity/workload.entity';
import { generateCompletedRepWorkloadsStub } from '../../src/training/mock/workload.stub';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { generateInstitutionStub } from '../../src/institution/mock/institution.mock';

describe('Training Workloads (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let groupService: GroupService;
  let workloadService: WorkloadService;

  let group: Group;
  let component: Component;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    workloadService = moduleFixture.get(WorkloadService);

    component = await componentService.create(
      generateComponentStub({ params: { [DEFAULT_PARAMS_KEY]: [] } }),
    );

    const [athlete2, athlete3] = await Promise.all([
      createAthleteUserAndToken(firebaseService),
      createAthleteUserAndToken(firebaseService),
    ]);

    const institutionService = moduleFixture.get(InstitutionService);
    const institution = await institutionService.create(
      global.admin,
      generateInstitutionStub(),
    );

    group = await createGroupWithCycles(groupService, {
      institutionId: institution.id,
      membersIds: [athlete.uid, athlete2.uid, athlete3.uid],
    });
  });

  beforeEach(async () =>
    Promise.all([
      firebaseService.deleteCollection(FirestoreCollection.EXERCISE),
      firebaseService.deleteCollection(FirestoreCollection.TRAINING),
      firebaseService.deleteCollection(FirestoreCollection.TRAINING_WORKLOAD),
    ]),
  );

  afterAll(async () =>
    Promise.all([
      firebaseService.deleteCollection(FirestoreCollection.EXERCISE),
      firebaseService.deleteCollection(FirestoreCollection.GROUP),
      firebaseService.deleteCollection(FirestoreCollection.TRAINING),
      await app.close(),
    ]),
  );

  describe('Create workloads', () => {
    it('should successfully create training workloads for all members for training if only sets are provided', async () => {
      const exercises = await exerciseService.createMany(admin, [
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                  generateTrainingExercise({ id: exercises[2].id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await trainingService.create(trainer, training);
      const trainingExercises = response.components.flatMap((c) =>
        c.supersets.flatMap((s) => s.exercises),
      );

      for (const e of trainingExercises) {
        expect(e.sets).toHaveLength(1);
        expect(e.params).toEqual([]);
      }

      const workloads = await workloadService.findAllByTraining(response.id);
      expect(workloads).toHaveLength(9); // 3 members * 3 exercises * 1 set each (defaults to 1 set if vol work sets omitted)

      for (const workload of workloads) {
        expect(workload.volWork1Type).toBeUndefined();
        expect(workload.prescribedVolWork1ValueL).toBeUndefined();
        expect(workload.prescribedVolWork1ValueR).toBeUndefined();
        expect(workload.volWork1ValueL).toBeNull();
        expect(workload.volWork1ValueR).toBeNull();

        expect(workload.volRecType).toBeUndefined();
        expect(workload.prescribedVolWork1ValueL).toBeUndefined();
        expect(workload.prescribedVolWork1ValueR).toBeUndefined();
        expect(workload.volRecValueL).toBeNull();
        expect(workload.volRecValueR).toBeNull();

        expect(workload.intWork1Type).toBeUndefined();
        expect(workload.prescribedIntWork1ValueL).toBeUndefined();
        expect(workload.prescribedIntWork1ValueR).toBeUndefined();
        expect(workload.intWork1ValueL).toBeNull();
        expect(workload.intWork1ValueR).toBeNull();

        expect(workload.intRecType).toBeUndefined();
        expect(workload.prescribedIntRecValueL).toBeUndefined();
        expect(workload.prescribedIntRecValueR).toBeUndefined();
        expect(workload.intRecValueL).toBeNull();
        expect(workload.intRecValueR).toBeNull();
      }
    });

    it('should successfully create training workloads for all members for training for a single param value', async () => {
      const exercises = await exerciseService.createMany(admin, [
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                  generateTrainingExercise({ id: exercises[2].id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await trainingService.create(trainer, training);
      const trainingExercises = response.components.flatMap((c) =>
        c.supersets.flatMap((s) => s.exercises),
      );

      for (const e of trainingExercises) {
        expect(e.sets).toHaveLength(1);
        expect(e.params).toEqual([]);
      }

      const workloads = await workloadService.findAllByTraining(response.id);
      expect(workloads).toHaveLength(9); // 3 members * 3 exercises * 1 set each (defaults to 1 set if vol work sets omitted)

      for (const workload of workloads) {
        expect(workload.volWork1Type).toBeUndefined();
        expect(workload.prescribedVolWork1ValueL).toBeUndefined();
        expect(workload.volWork1ValueL).toBeNull();
        expect(workload.volRecType).toBeUndefined();
        expect(workload.prescribedVolWork1ValueL).toBeUndefined();
        expect(workload.volRecValueL).toBeNull();
        expect(workload.intWork1Type).toBeUndefined();
        expect(workload.prescribedIntWork1ValueL).toBeUndefined();
        expect(workload.intWork1ValueL).toBeNull();
        expect(workload.intRecType).toBeUndefined();
        expect(workload.prescribedIntRecValueL).toBeUndefined();
        expect(workload.intRecValueL).toBeNull();
      }
    });

    it('should successfully create training workloads for all members for training for multiple param values', async () => {
      const component = await componentService.create(
        generateComponentStub({
          params: {
            [DEFAULT_PARAMS_KEY]: [
              { field: ParamType.VolWorkSets },
              {
                field: ParamType.VolWork1,
                options: [{ field: VolType.Rep }, { field: VolType.Dist }],
              },
              {
                field: ParamType.VolRec1,
                options: [{ field: VolType.Time }],
              },
              {
                field: ParamType.IntWork1,
                options: [{ field: IntType.Kg }],
              },
              {
                field: ParamType.IntRec1,
                options: [
                  {
                    field: IntType.Eff,
                    defaultValue: '1',
                    options: [{ field: '1' }, { field: '0' }],
                  },
                ],
              },
            ],
          },
        }),
      );

      const exercises = await exerciseService.createMany(admin, [
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
        generateExerciseStub({ componentIds: [component.id] }),
      ]);

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: exercises[0].id }),
                  generateTrainingExercise({ id: exercises[1].id }),
                  generateTrainingExercise({ id: exercises[2].id }),
                ],
              }),
            ],
          }),
        ],
      });

      const response = await trainingService.create(trainer, training);
      const trainingExercises = response.components.flatMap((c) =>
        c.supersets.flatMap((s) => s.exercises),
      );

      for (const e of trainingExercises) {
        expect(e.sets).toHaveLength(3);
        expect(e.params).toEqual([
          PARAMS.find((p) => p.field === ParamType.VolWorkSets),
          {
            ...PARAMS.find((p) => p.field === ParamType.VolWork1),
            options: [
              VOL_OPTIONS.find((o) => o.field === VolType.Rep),
              VOL_OPTIONS.find((o) => o.field === VolType.Dist),
            ],
          },
          {
            ...PARAMS.find((p) => p.field === ParamType.VolRec1),
            options: [VOL_OPTIONS.find((o) => o.field === VolType.Time)],
          },
          {
            ...PARAMS.find((p) => p.field === ParamType.IntWork1),
            options: [INT_OPTIONS.find((o) => o.field === IntType.Kg)],
          },
          {
            ...PARAMS.find((p) => p.field === ParamType.IntRec1),
            options: [
              {
                ...INT_OPTIONS.find((o) => o.field === IntType.Eff),
                defaultValue: '1',
                options: [
                  {
                    field: '1',
                    name: 'Mod',
                    type: AttributeType.Value,
                    options: [],
                    defaultValue: '1',
                  },
                  {
                    field: '0',
                    name: 'Easy',
                    type: AttributeType.Value,
                    options: [],
                    defaultValue: '0',
                  },
                ],
              },
            ],
          },
        ]);
      }

      const workloads = await workloadService.findAllByTraining(response.id);
      expect(workloads).toHaveLength(27); // 3 members * 3 exercises * 3 sets each

      for (const workload of workloads) {
        expect(workload.volWork1Type).toBe(VolType.Rep);
        expect(workload.prescribedVolWork1ValueL).toBe(12);
        expect(workload.volWork1ValueL).toBeNull();
        expect(workload.volWork2Type).toBeUndefined();
        expect(workload.prescribedVolWork2ValueL).toBeUndefined();
        expect(workload.volWork2ValueL).toBeNull();
        expect(workload.volRecType).toBe(VolType.Time);
        expect(workload.prescribedVolRecValueL).toBe(30);
        expect(workload.volRecValueL).toBeNull();
        expect(workload.intWork1Type).toBe(IntType.Kg);
        expect(workload.prescribedIntWork1ValueL).toBe(20);
        expect(workload.intWork1ValueL).toBeNull();
        expect(workload.intWork2Type).toBeUndefined;
        expect(workload.prescribedIntWork2ValueL).toBeUndefined;
        expect(workload.intWork2ValueL).toBeNull();
        expect(workload.intRecType).toBe(IntType.Eff);
        expect(workload.prescribedIntRecValueL).toBe(1);
        expect(workload.intRecValueL).toBeNull();
      }
    });

    it.each([IntType.Hrmax, IntType.Mas])(
      'should correctly calculate prescribed intensity values for %s type',
      async (intType) => {
        const component = await componentService.create(
          generateComponentStub({
            params: {
              [DEFAULT_PARAMS_KEY]: [
                { field: ParamType.VolWorkSets },
                {
                  field: ParamType.IntWork1,
                  options: [{ field: intType, defaultValue: '70' }],
                },
              ],
            },
          }),
        );

        const exercise = await exerciseService.create(
          admin,
          generateExerciseStub({ componentIds: [component.id] }),
        );

        const training = generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: component.id,
              supersets: [
                generateSuperset({
                  exercises: [generateTrainingExercise({ id: exercise.id })],
                }),
              ],
            }),
          ],
        });

        const response = await trainingService.create(trainer, training);
        const workloads = await workloadService.findAllByTraining(response.id);

        expect(workloads).toHaveLength(9); // 3 members * 1 exercise * 3 sets
        for (const workload of workloads) {
          expect(workload.intWork1Type).toBe(intType);
          expect(workload.prescribedIntWork1ValueL).toBe(0.7);
          expect(workload.intWork1ValueL).toBeNull();
        }
      },
    );

    it('should successfully create training workloads for all members for training for rm', async () => {
      const component = await componentService.create(
        generateComponentStub({
          params: {
            [DEFAULT_PARAMS_KEY]: [
              { field: ParamType.VolWorkSets },
              {
                field: ParamType.IntWork1,
                options: [{ field: IntType.Rm, defaultValue: '1' }],
              },
            ],
          },
        }),
      );

      const exercise = await exerciseService.create(
        admin,
        generateExerciseStub({ componentIds: [component.id] }),
      );

      const training = generateTrainingStub({
        groupId: group.id,
        cycleId: group.cycles[1].id,
        components: [
          generateTrainingComponent({
            id: component.id,
            supersets: [
              generateSuperset({
                exercises: [generateTrainingExercise({ id: exercise.id })],
              }),
            ],
          }),
        ],
      });

      const mockWorkloads: Workload[] = group.membersIds.flatMap((userId) =>
        generateCompletedRepWorkloadsStub(
          {
            userId,
            trainingId: 'mockTrainingId',
            componentId: component.id,
            exerciseId: exercise.id,
          },
          3,
          12,
          IntType.Kg,
          80,
          -3,
          +10,
        ),
      );

      jest
        .spyOn(workloadService, 'findAllByMembers')
        .mockImplementationOnce(async () => mockWorkloads);

      const response = await trainingService.create(trainer, training);
      const workloads = await workloadService.findAllByTraining(response.id);
      expect(workloads).toHaveLength(9); // 3 members * 1 exercise * 3 sets

      for (const workload of workloads) {
        expect(workload.intWork1Type).toBe(IntType.Rm);
        expect(workload.prescribedIntWork1ValueL).toBeGreaterThanOrEqual(113); // epley and brzycki return value 116.1, lander returns 113.5
        expect(workload.intWork1ValueL).toBeNull();
      }
    });

    it('should successfully create training workloads for all members for training for bw', async () => {
      const component = await componentService.create(
        generateComponentStub({
          params: {
            [DEFAULT_PARAMS_KEY]: [
              { field: ParamType.VolWorkSets },
              {
                field: ParamType.IntWork1,
                options: [{ field: IntType.Bw, defaultValue: '50' }], // 50% of bodyweight
              },
            ],
          },
        }),
      );

      const exercise = await exerciseService.create(
        admin,
        generateExerciseStub({ componentIds: [component.id] }),
      );

      const response = await trainingService.create(
        trainer,
        generateTrainingStub({
          groupId: group.id,
          cycleId: group.cycles[1].id,
          components: [
            generateTrainingComponent({
              id: component.id,
              supersets: [
                generateSuperset({
                  exercises: [generateTrainingExercise({ id: exercise.id })],
                }),
              ],
            }),
          ],
        }),
      );

      const workloads = await workloadService.findAllByTraining(response.id);
    });

    it('should successfully create training workloads for all members for training for exercises that have custom attributes and parameters', async () => {});
  });

  describe('Update workloads', () => {
    it('should re-create training workloads if training exercise data is updated', async () => {});

    it('should update exercise workloads by provided component id', async () => {});
  });
});
