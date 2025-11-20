import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { validationSchema } from '@src/config/environment-validation-schema';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseAttributeService } from '@src/exercise/service/exercise-attribute.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { MAIN_GROUP_PARENT_ID } from '@src/training/constant/main-group-parent-id.constant';
import type { Training } from '@src/training/entity/training.entity';
import type { TrainingComponent } from '@src/training/entity/training-component.entity';
import {
  generateSubgroup,
  generateTrainingComponent,
  generateTrainingStub,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

describe('Subgroups Utilities', () => {
  let service: TrainingPlanService;

  let source: TrainingComponent;
  let target: Training;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validationSchema }),
        CommonModule,
      ],
      providers: [
        {
          provide: FirebaseService,
          useValue: createMock<FirebaseService>(),
        },
        {
          provide: CacheManagerService,
          useValue: createMock<CacheManagerService>(),
        },
        {
          provide: AttributeService,
          useValue: createMock<AttributeService>(),
        },
        {
          provide: InstitutionService,
          useValue: createMock<InstitutionService>(),
        },
        {
          provide: ExerciseService,
          useValue: createMock<ExerciseService>(),
        },
        {
          provide: ExerciseAttributeService,
          useValue: createMock<ExerciseAttributeService>(),
        },
        {
          provide: WorkloadRepository,
          useValue: createMock<WorkloadRepository>(),
        },
        {
          provide: WorkloadService,
          useValue: createMock<WorkloadService>(),
        },
        ExerciseParamService,
        TrainingPlanService,
      ],
    }).compile();

    service = moduleRef.get(TrainingPlanService);
  });

  describe('copyOrOverrideSubgroup', () => {
    beforeEach(() => {
      // Reset target subgroups before each test
      source = generateTrainingComponent({
        id: 'c1',
        subgroups: [
          generateSubgroup({ id: 's1', membersIds: ['a', 'b', 'c', 'd'] }), // root subgroup 1
          generateSubgroup({ id: 's1.1', membersIds: ['b'], parentId: 's1' }), // child 1
          generateSubgroup({ id: 's1.2', membersIds: ['d'], parentId: 's1' }), // child 2
          generateSubgroup({ id: 's2', membersIds: ['e', 'f', 'g'] }), // root subgroup 2 (without children)
          generateSubgroup({
            id: 'invalid-child',
            membersIds: ['x'],
            parentId: 'invalid',
          }), // invalid child
        ],
      });

      target = generateTrainingStub({
        ownerId: 'test-owner',
        membersIds: [],
        components: [
          generateTrainingComponent({
            id: 'c1',
            subgroups: [
              generateSubgroup({ id: 's3', membersIds: ['a', 'b', 'h', 'i'] }), // existing subgroup in target
            ],
          }),
        ],
      });
    });

    it('should not copy subgroup if subgroup does not exist in provided training component', async () => {
      expect(() => {
        service.copyOrOverrideSubgroup(
          'invalid',
          source,
          generateTrainingStub({
            ownerId: 'test',
            membersIds: [],
            components: [source],
          }),
        );
      }).toThrow('Subgroup with id invalid not found');
    });

    it('should copy root subgroup and remove overlapping members from target', () => {
      service.copyOrOverrideSubgroup('s1', source, target);

      expect(target.components[0].subgroups).toHaveLength(4); // 1 original + 3 copied (1 root, 2 children)
      expect(target.components[0].subgroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 's3', membersIds: ['h', 'i'] }), // a and b are in source
          expect.objectContaining({
            id: 's1',
            membersIds: ['a', 'b', 'c', 'd'],
          }),
          expect.objectContaining({ id: 's1.1', membersIds: ['b'] }),
          expect.objectContaining({ id: 's1.2', membersIds: ['d'] }),
        ]),
      );
    });

    it('should copy child subgroup and its parent if parent exists', () => {
      service.copyOrOverrideSubgroup('s1.1', source, target);

      expect(target.components[0].subgroups).toHaveLength(3);
      expect(target.components[0].subgroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 's3', membersIds: ['h', 'i'] }),
          expect.objectContaining({
            id: 's1',
            membersIds: ['a', 'b', 'c', 'd'],
          }),
          expect.objectContaining({ id: 's1.1', membersIds: ['b'] }),
        ]),
      );
    });

    it('should copy child subgroup and make it root if parent does not exist', () => {
      service.copyOrOverrideSubgroup('invalid-child', source, target);

      expect(target.components[0].subgroups).toHaveLength(2);
      expect(target.components[0].subgroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 's3',
            membersIds: ['a', 'b', 'h', 'i'],
          }),
          expect.objectContaining({
            id: 'invalid-child',
            membersIds: ['x'],
            parentId: undefined,
          }),
        ]),
      );
    });

    it('should remove empty subgroups after copying', () => {
      const targetWithEmpty = generateTrainingStub({
        ownerId: 'test-owner',
        membersIds: [],
        components: [
          generateTrainingComponent({
            id: 'c1',
            subgroups: [
              generateSubgroup({ id: 's4', membersIds: ['e', 'f'] }), // empty subgroup
              generateSubgroup({ id: 's5', membersIds: ['g'] }), // non-empty subgroup
            ],
          }),
        ],
      });

      service.copyOrOverrideSubgroup('s2', source, targetWithEmpty);

      expect(targetWithEmpty.components[0].subgroups).toHaveLength(1); // only copied subgroup should remain
      expect(targetWithEmpty.components[0].subgroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 's2', membersIds: ['e', 'f', 'g'] }),
        ]),
      );
    });

    it('should correctly copy source subgroup if target already has nested subgroups', () => {
      const nestedTarget = generateTrainingStub({
        ownerId: 'test-owner',
        membersIds: [],
        components: [
          generateTrainingComponent({
            id: 'c1',
            subgroups: [
              generateSubgroup({ id: 's6', membersIds: ['f', 'g', 'c'] }), // existing subgroup in target
              generateSubgroup({
                id: 's6.1',
                membersIds: ['f'],
                parentId: 's6',
              }),
              generateSubgroup({
                id: 's6.2',
                membersIds: ['g'],
                parentId: 's6',
              }),
            ],
          }),
        ],
      });

      service.copyOrOverrideSubgroup('s2', source, nestedTarget);

      expect(nestedTarget.components[0].subgroups).toHaveLength(2);
      expect(nestedTarget.components[0].subgroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 's6', membersIds: ['c'] }), // c is not in source
          expect.objectContaining({ id: 's2', membersIds: ['e', 'f', 'g'] }),
        ]),
      );
    });
  });

  describe('moveUserToVirtualSubgroup', () => {
    it('should create virtual subgroup under main group when user is in main group', () => {
      const training: Training = generateTrainingStub({
        ownerId: 'owner1',
        membersIds: ['a', 'b', 'c', 'x'],
        components: [generateTrainingComponent({ id: 'c1' })],
      });

      const result = service.moveUserToVirtualSubgroup(training, 'c1', 'x');
      const updated = result.components[0].subgroups;
      expect(updated).toHaveLength(1); // 1 subgroup created

      const subgroup = updated.find((s) => s.id === 'x');
      expect(subgroup).toBeDefined();
      expect(subgroup!.parentId).toBe(MAIN_GROUP_PARENT_ID);
      expect(subgroup!.membersIds).toEqual(['x']);
    });

    it('should create virtual subgroup under the subgroup parent when user is in a regular subgroup', () => {
      const training: Training = generateTrainingStub({
        ownerId: 'owner1',
        membersIds: ['a', 'b', 'c', 'y'],
        components: [
          generateTrainingComponent({
            id: 'c1',
            subgroups: [generateSubgroup({ id: 's1', membersIds: ['a', 'y'] })],
          }),
        ],
      });

      const result = service.moveUserToVirtualSubgroup(training, 'c1', 'y');
      const updated = result.components[0].subgroups;
      expect(updated).toHaveLength(2); // 1 original + 1 created

      const subgroup = updated.find((s) => s.id === 'y');
      expect(subgroup).toBeDefined();
      expect(subgroup!.parentId).toBe('s1');
      expect(subgroup!.membersIds).toEqual(['y']);
    });

    it('should do nothing if user is already in a virtual subgroup', () => {
      const training: Training = generateTrainingStub({
        ownerId: 'owner1',
        membersIds: ['a', 'b', 'c', 'z'],
        components: [
          generateTrainingComponent({
            id: 'c1',
            subgroups: [
              generateSubgroup({ id: 's1', membersIds: ['a', 'b', 'z'] }),
              generateSubgroup({ id: 'z', membersIds: ['z'], parentId: 's1' }), // virtual subgroup
            ],
          }),
        ],
      });

      const result = service.moveUserToVirtualSubgroup(training, 'c1', 'z');
      const updated = result.components[0].subgroups;
      expect(updated).toHaveLength(2); // no new subgroup created

      const subgroup = updated.find((s) => s.id === 'z');
      expect(subgroup).toBeDefined();
      expect(subgroup!.parentId).toBe('s1');
      expect(subgroup!.membersIds).toEqual(['z']);
    });
  });
});
