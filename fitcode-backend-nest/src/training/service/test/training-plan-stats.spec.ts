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
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
} from '@src/training/mock/training.stub';
import { WorkloadRepository } from '@src/training/repository/workload.repository';

import { TrainingPlanService } from '../training-plan.service';
import { WorkloadService } from '../workload.service';

describe('getSetData', () => {
  let service: TrainingPlanService;

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
        AttributeService,
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

  describe('calculatePrescribedTrainingStats', () => {
    it('should handle empty components gracefully', () => {
      const stats = service.calculatePrescribedTrainingStats([], 1);
      expect(stats).toHaveLength(0);
    });

    it('should return correct stats for main group for a single athlete for one component', () => {
      const sets = [
        generateExerciseSet(1),
        generateExerciseSet(2),
        generateExerciseSet(3),
      ];

      const component = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'squat', sets }),
              generateTrainingExercise({ id: 'bench', sets }),
              generateTrainingExercise({ id: 'deadlift', sets }),
            ],
          }),
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'pull-up', sets }),
              generateTrainingExercise({ id: 'overhead-press', sets }),
              generateTrainingExercise({ id: 'barbell-row', sets }),
              generateTrainingExercise({ id: 'deadlift', sets }), // duplicate exercise for testing
            ],
          }),
        ],
      });

      const stats = service.calculatePrescribedTrainingStats([component], 1);
      expect(stats).toHaveLength(6); // 6 unique exercises
      stats.forEach((stat) => {
        expect(stat.intensity).toBe(20); // default kg value
        expect(stat.volume).toBe(12); // default rep value
        expect(stat.exerciseId).toBe(stat.exerciseId);
        expect(stat.rootComponentId).toBe(component.id);
        expect(stat.numMembers).toBe(stat.exerciseId === 'deadlift' ? 2 : 1); // deadlift appears twice
      });
    });

    it('should return correct stats for main group for a single athlete for multiple components', () => {
      const sets = [
        generateExerciseSet(1),
        generateExerciseSet(2),
        generateExerciseSet(3),
      ];

      const component1 = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'squat', sets }),
              generateTrainingExercise({ id: 'bench', sets }),
              generateTrainingExercise({ id: 'deadlift', sets }),
            ],
          }),
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'pull-up', sets }),
              generateTrainingExercise({ id: 'overhead-press', sets }),
              generateTrainingExercise({ id: 'barbell-row', sets }),
              generateTrainingExercise({ id: 'deadlift', sets }), // duplicate exercise for testing
            ],
          }),
        ],
      });

      const component2 = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'sprints', sets }),
              generateTrainingExercise({ id: 'jogging', sets }),
            ],
          }),
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'sprints', sets }),
              generateTrainingExercise({ id: 'jogging', sets }),
            ],
          }),
        ],
      });

      const stats = service.calculatePrescribedTrainingStats(
        [component1, component2],
        1,
      );

      expect(stats).toHaveLength(8); // 8 unique exercises

      const c1Stats = stats.filter(
        (stat) => stat.rootComponentId === component1.id,
      );

      const c2Stats = stats.filter(
        (stat) => stat.rootComponentId === component2.id,
      );

      expect(c1Stats).toHaveLength(6); // 6 unique exercises from component1
      expect(c2Stats).toHaveLength(2); // 2 unique exercises from component2

      c1Stats.forEach((stat) => {
        expect(stat.intensity).toBe(20); // default kg value
        expect(stat.volume).toBe(12); // default rep value
        expect(stat.numMembers).toBe(
          stat.exerciseId === 'deadlift' ? 2 : 1, // deadlift appears twice
        );
      });

      c2Stats.forEach((stat) => {
        expect(stat.intensity).toBe(20); // default kg value
        expect(stat.volume).toBe(12); // default rep value
        expect(stat.numMembers).toBe(2);
      });
    });

    it('should return correct stats for multiple athletes in a group', () => {
      const sets = [
        generateExerciseSet(1),
        generateExerciseSet(2),
        generateExerciseSet(3),
      ];

      const component = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'squat', sets }),
              generateTrainingExercise({ id: 'bench', sets }),
              generateTrainingExercise({ id: 'deadlift', sets }),
            ],
          }),
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'pull-up', sets }),
              generateTrainingExercise({ id: 'overhead-press', sets }),
              generateTrainingExercise({ id: 'barbell-row', sets }),
              generateTrainingExercise({ id: 'deadlift', sets }), // duplicate exercise for testing
            ],
          }),
        ],
      });

      const stats = service.calculatePrescribedTrainingStats([component], 3);
      expect(stats).toHaveLength(6); // 6 unique exercises
      stats.forEach((stat) => {
        expect(stat.intensity).toBe(20); // default kg value
        expect(stat.volume).toBe(12); // default rep value
        expect(stat.exerciseId).toBe(stat.exerciseId);
        expect(stat.rootComponentId).toBe(component.id);
        expect(stat.numMembers).toBe(
          stat.exerciseId === 'deadlift' ? 6 : 3, // deadlift appears twice
        );
      });
    });

    it('should return correct stats for subgroups for a single athlete', () => {
      const sets = [
        generateExerciseSet(1),
        generateExerciseSet(2),
        generateExerciseSet(3),
      ];

      const component = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'deadlift', sets }),
              generateTrainingExercise({ id: 'pull-up', sets }),
            ],
          }),
        ],
        subgroups: [
          generateSubgroup({
            membersIds: ['athlete1'], // 1 member
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: 'overhead-press', sets }),
                  generateTrainingExercise({ id: 'barbell-row', sets }),
                  generateTrainingExercise({ id: 'deadlift', sets }),
                ],
              }),
            ],
          }),
        ],
      });

      const stats = service.calculatePrescribedTrainingStats([component], 2); // must be 2 since subgroup has 1 member and main group has 1 member
      expect(stats).toHaveLength(4); // 4 unique exercises

      stats.forEach((stat) => {
        expect(stat.intensity).toBe(20); // default kg value
        expect(stat.volume).toBe(12); // default rep value
        expect(stat.rootComponentId).toBe(component.id);
      });
    });

    it('should return correct stats for subgroups for multiple athletes', () => {
      const sets = [
        generateExerciseSet(1),
        generateExerciseSet(2),
        generateExerciseSet(3),
      ];

      const component = generateTrainingComponent({
        supersets: [
          generateSuperset({
            exercises: [
              generateTrainingExercise({ id: 'deadlift', sets }),
              generateTrainingExercise({ id: 'pull-up', sets }),
            ],
          }),
        ],
        subgroups: [
          generateSubgroup({
            membersIds: ['athlete1', 'athlete2'], // 2 members
            supersets: [
              generateSuperset({
                exercises: [
                  generateTrainingExercise({ id: 'overhead-press', sets }),
                  generateTrainingExercise({ id: 'barbell-row', sets }),
                  generateTrainingExercise({ id: 'deadlift', sets }),
                ],
              }),
            ],
          }),
        ],
      });

      const stats = service.calculatePrescribedTrainingStats([component], 4); // must be 4 since subgroup has 2 members and main group has 2 members
      expect(stats).toHaveLength(4); // 4 unique exercises

      stats.forEach((stat) => {
        expect(stat.intensity).toBe(20); // default kg value
        expect(stat.volume).toBe(12); // default rep value
        expect(stat.rootComponentId).toBe(component.id);
      });
    });
  });
});
