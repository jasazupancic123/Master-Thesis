import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AttributeRepository } from '@src/attribute/repository/attribute.repository';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { CommonModule } from '@src/common/common.module';
import { ComponentService } from '@src/component/component.service';
import { ComponentRepository } from '@src/component/repository/component.repository';
import { validationSchema } from '@src/config/environment-validation-schema';
import { ExerciseAttributeValueRepository } from '@src/exercise/repository/exercise-attribute-value.repository';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { InstitutionService } from '@src/institution/service/institution.service';
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

describe('copySubgroup', () => {
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
          provide: AttributeRepository,
          useValue: createMock<AttributeRepository>(),
        },
        {
          provide: AttributeService,
          useValue: createMock<AttributeService>(),
        },
        {
          provide: ComponentRepository,
          useValue: createMock<ComponentRepository>,
        },
        {
          provide: ComponentService,
          useValue: createMock<ComponentService>(),
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
          provide: ExerciseAttributeValueRepository,
          useValue: createMock<ExerciseAttributeValueRepository>(),
        },
        {
          provide: WorkloadRepository,
          useValue: createMock<WorkloadRepository>(),
        },
        {
          provide: WorkloadService,
          useValue: createMock<WorkloadService>(),
        },
        TrainingPlanService,
      ],
    }).compile();

    service = moduleRef.get(TrainingPlanService);
  });

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
      service.copySubgroupIntoTraining(
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
    service.copySubgroupIntoTraining('s1', source, target);

    expect(target.components[0].subgroups).toHaveLength(4); // 1 original + 3 copied (1 root, 2 children)
    expect(target.components[0].subgroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's3', membersIds: ['h', 'i'] }), // a and b are in source
        expect.objectContaining({ id: 's1', membersIds: ['a', 'b', 'c', 'd'] }),
        expect.objectContaining({ id: 's1.1', membersIds: ['b'] }),
        expect.objectContaining({ id: 's1.2', membersIds: ['d'] }),
      ]),
    );
  });

  it('should copy child subgroup and its parent if parent exists', () => {
    service.copySubgroupIntoTraining('s1.1', source, target);

    expect(target.components[0].subgroups).toHaveLength(3);
    expect(target.components[0].subgroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's3', membersIds: ['h', 'i'] }),
        expect.objectContaining({ id: 's1', membersIds: ['a', 'b', 'c', 'd'] }),
        expect.objectContaining({ id: 's1.1', membersIds: ['b'] }),
      ]),
    );
  });

  it('should copy child subgroup and make it root if parent does not exist', () => {
    service.copySubgroupIntoTraining('invalid-child', source, target);

    expect(target.components[0].subgroups).toHaveLength(2);
    expect(target.components[0].subgroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's3', membersIds: ['a', 'b', 'h', 'i'] }),
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

    service.copySubgroupIntoTraining('s2', source, targetWithEmpty);

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
            generateSubgroup({ id: 's6.1', membersIds: ['f'], parentId: 's6' }),
            generateSubgroup({ id: 's6.2', membersIds: ['g'], parentId: 's6' }),
          ],
        }),
      ],
    });

    service.copySubgroupIntoTraining('s2', source, nestedTarget);

    expect(nestedTarget.components[0].subgroups).toHaveLength(2);
    expect(nestedTarget.components[0].subgroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 's6', membersIds: ['c'] }), // c is not in source
        expect.objectContaining({ id: 's2', membersIds: ['e', 'f', 'g'] }),
      ]),
    );
  });
});
