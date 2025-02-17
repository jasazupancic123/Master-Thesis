import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/service/common.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { TrainingRepository } from '../repository/training.repository';
import { FieldValue } from 'firebase-admin/firestore';
import {
  TrainingRef,
  TrainingComponentRef,
  TrainingSupersetRef,
  TrainingExerciseRef,
  SubgroupRef,
} from 'src/common/type/firebase-firestore.type';
import { Superset } from '../entity/superset.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';
import { UpdateTrainingComponent } from '../type/training-component.type';
import {
  CreateTrainingExercise,
  UpdateTrainingExercise,
} from '../type/training-exercise.type';
import { CacheManagerService } from 'src/cache-manager/cache-manager.service';
import { UserWorkloadService } from './user-workload.service';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingWorkloadService: UserWorkloadService,
  ) {}

  getAddComponentsQuery(
    training: Training,
    ref: Required<TrainingRef> & SubgroupRef,
    input: [string, TrainingComponent][], // [componentId, component input][]
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components`
      : `components`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    const query = Object.fromEntries(
      input.map(([id, c]) => [
        `${prefix}.${id}`,
        {
          id,
          order: c.order || 0,
          color: c.color || this.commonService.color.random(),
          supersets: c.supersets?.length
            ? c.supersets.map((superset) => ({
                exercises: superset.exercises,
                color: superset.color,
              }))
            : [
                {
                  exercises: {},
                  color: this.commonService.color.random(),
                },
              ],
        },
      ]),
    );

    trainingOrSubgroupRef.components = {
      ...trainingOrSubgroupRef.components,
      ...this.commonService.object.removeKeyPrefix(query, prefix),
    };

    return [query, training];
  }

  getUpdateComponentQuery(
    training: Training,
    ref: Required<TrainingComponentRef> & SubgroupRef,
    input: UpdateTrainingComponent,
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}`
      : `components.${ref.componentId}`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    const query = {
      ...(input.color && { [`${prefix}.color`]: input.color }),
      ...(input.order && { [`${prefix}.order`]: input.order }),
    };

    trainingOrSubgroupRef.components = {
      ...trainingOrSubgroupRef.components,
      [ref.componentId]: {
        ...training.components[ref.componentId],
        ...input,
      },
    };

    return [query, training];
  }

  getDeleteComponentQuery(
    training: Training,
    ref: Required<TrainingComponentRef> & SubgroupRef,
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}`
      : `components.${ref.componentId}`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    const query = { [prefix]: FieldValue.delete() };
    const { [ref.componentId]: _, ...components } =
      trainingOrSubgroupRef.components;
    trainingOrSubgroupRef.components = components;

    return [query, training];
  }

  getAddSupersetsQuery(
    training: Training,
    ref: Required<TrainingComponentRef> & SubgroupRef,
    input: Omit<Superset, 'exercises'>[],
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}.supersets`
      : `components.${ref.componentId}.supersets`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    const supersets =
      trainingOrSubgroupRef.components[ref.componentId].supersets || [];

    const addSupersets = [
      ...supersets,
      ...input.map((item) => ({
        color: item.color,
        exercises: {},
      })),
    ];

    const query = { [prefix]: addSupersets };
    trainingOrSubgroupRef.components[ref.componentId].supersets = addSupersets;

    return [query, training];
  }

  getUpdateSupersetQuery(
    training: Training,
    ref: Required<TrainingSupersetRef> & SubgroupRef,
    input: Partial<Superset>,
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}.supersets`
      : `components.${ref.componentId}.supersets`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    // update superset
    let supersets =
      trainingOrSubgroupRef.components[ref.componentId].supersets || [];
    const updatedSuperset = { ...supersets[ref.superset], ...input };
    supersets = supersets.filter((_, i) => i !== ref.superset); // remove old superset

    // insert at new index if 'order' is specified, otherwise keep the same index
    const newIndex = input.order !== undefined ? input.order : ref.superset;
    supersets.splice(newIndex, 0, updatedSuperset);

    const query = { [prefix]: supersets };
    trainingOrSubgroupRef.components[ref.componentId].supersets = supersets;

    return [query, training];
  }

  getDeleteSupersetQuery(
    training: Training,
    ref: Required<TrainingSupersetRef> & SubgroupRef,
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}.supersets`
      : `components.${ref.componentId}.supersets`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    // remove superset
    const index = ref.superset;
    let supersets = training.components[ref.componentId].supersets || [];
    supersets = supersets.filter((_, i) => i !== index);

    const query = { [prefix]: supersets };
    trainingOrSubgroupRef.components[ref.componentId].supersets = supersets;

    return [query, training];
  }

  getAddExercisesQuery(
    training: Training,
    ref: Required<TrainingSupersetRef> & SubgroupRef,
    input: [string, CreateTrainingExercise][], // [exerciseId, exercise][]
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}.supersets`
      : `components.${ref.componentId}.supersets`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    const supersets =
      trainingOrSubgroupRef.components[ref.componentId].supersets || [];

    // Check if the current superset already has 4 exercises
    if (Object.keys(supersets[ref.superset].exercises).length >= 4) {
      let emptySuperset = supersets.find(
        (superset) => Object.keys(superset.exercises).length < 4,
      );

      if (emptySuperset === undefined && supersets.length >= 4) {
        // All 4 supersets have 4 exercises
        throw new BadRequestException(
          'Maximum number of exercises per superset reached',
        );
      } else if (emptySuperset === undefined) {
        // Creating a new superset, since all current ones are full
        const newSupersetId = supersets.length;
        supersets.push({
          exercises: {},
        });
        ref.superset = newSupersetId;
      } else {
        // Found a superset with less than 4 exercises
        ref.superset = supersets.indexOf(emptySuperset);
      }
    }

    // Add exercises to the determined superset
    let order = Object.keys(supersets[ref.superset].exercises).length;
    supersets[ref.superset].exercises = {
      ...supersets[ref.superset].exercises,
      ...input
        .map(([id, data]) => ({
          [id]: {
            id,
            order: order++,
            color: data.color || this.commonService.color.random(),
            meta: { ...data.meta },
          },
        }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    const query = { [prefix]: supersets };
    trainingOrSubgroupRef.components[ref.componentId].supersets = supersets;

    return [query, training];
  }

  getUpdateExerciseQuery(
    training: Training,
    ref: Required<TrainingExerciseRef> & SubgroupRef,
    input: Partial<UpdateTrainingExercise>,
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}.supersets`
      : `components.${ref.componentId}.supersets`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    const supersets =
      trainingOrSubgroupRef.components[ref.componentId].supersets || [];
    const exercises = supersets[ref.superset].exercises || {};

    // update exercise
    const currentOrder = exercises[ref.exerciseId].order;
    const newOrder = input.order ?? currentOrder;

    // validate new order
    const exerciseIds = Object.keys(exercises);
    if (newOrder < 0 || newOrder >= exerciseIds.length)
      throw new BadRequestException('New order index out of bounds');

    // sort exercises by order & remove the exercise being updated
    const sortedExercises = exerciseIds
      .map((id) => ({ id, ...exercises[id] }))
      .sort((a, b) => a.order - b.order);

    const filteredExercises = sortedExercises.filter(
      (e) => e.id !== ref.exerciseId,
    );

    // insert the updated exercise at the new order position
    filteredExercises.splice(newOrder, 0, {
      id: exercises[ref.exerciseId].id,
      color: input.color ?? exercises[ref.exerciseId].color,
      order: newOrder,
      meta: { ...(input.meta ? input.meta : exercises[ref.exerciseId].meta) },
    });

    // reassign sequential order values to avoid duplicates
    const updatedExercises = filteredExercises.reduce(
      (acc, e, order) => {
        acc[e.id] = { ...e, order };
        return acc;
      },
      {} as Record<string, TrainingExercise>,
    );

    // update supersets
    supersets[ref.superset].exercises = updatedExercises;
    const query = { [prefix]: supersets };
    trainingOrSubgroupRef.components[ref.componentId].supersets = supersets;

    return [query, training];
  }

  getDeleteExerciseQuery(
    training: Training,
    ref: Required<TrainingExerciseRef> & SubgroupRef,
  ): [Record<string, any>, Training] {
    const prefix = ref.subgroupId
      ? `subgroups.${ref.subgroupId}.components.${ref.componentId}.supersets`
      : `components.${ref.componentId}.supersets`;

    const trainingOrSubgroupRef = ref.subgroupId
      ? training.subgroups[ref.subgroupId]
      : training;

    const supersets =
      trainingOrSubgroupRef.components[ref.componentId].supersets || [];
    const exercises = supersets[ref.superset].exercises || {};

    // remove exercise
    const { [ref.exerciseId]: _, ...updatedExercises } = exercises;
    supersets[ref.superset].exercises = updatedExercises;

    const query = { [prefix]: supersets };
    trainingOrSubgroupRef.components[ref.componentId].supersets = supersets;

    return [query, training];
  }
}
