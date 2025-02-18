import { Injectable } from '@nestjs/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { CommonService } from 'src/common/service/common.service';
import {
  SubgroupRef,
  TrainingComponentRef,
  TrainingRef,
} from 'src/common/type/firebase-firestore.type';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';

@Injectable()
export class TrainingPlanService {
  constructor(private readonly commonService: CommonService) {}

  getAddComponentsQuery(
    training: Training,
    input: Omit<TrainingComponent, 'subgroups' | 'supersets'>[],
  ): [Record<string, any>, Training] {
    const query = {
      components: [
        ...training.components.map((c) => ({
          ...c,
          from: Timestamp.fromDate(c.from), // explicit conversion of date types
          to: Timestamp.fromDate(c.to),
        })),
        ...input.map((c) => ({
          id: c.id,
          color: c.color || this.commonService.color.random(),
          from: Timestamp.fromDate(c.from ? c.from : new Date()),
          to: Timestamp.fromDate(c.to ? c.to : new Date()),
          subgroups: [],
          supersets: [
            {
              exercises: [],
              color: this.commonService.color.random(),
            },
          ],
        })),
      ],
    };

    training.components = [
      ...training.components,
      ...input.map((c) => ({
        id: c.id,
        color: c.color || this.commonService.color.random(),
        from: c.from ? c.from : new Date(),
        to: c.to ? c.to : new Date(),
        subgroups: [],
        supersets: [
          {
            exercises: [],
            color: this.commonService.color.random(),
          },
        ],
      })),
    ];

    return [query, training];
  }

  getDeleteComponentQuery(
    training: Training,
    ref: TrainingComponentRef,
  ): [Record<string, any>, Training] {
    const updatedComponents = training.components.filter(
      (c) => c.id !== ref.componentId,
    );

    const query = { components: updatedComponents };
    training.components = updatedComponents;
    return [query, training];
  }

  /* getAddSupersetsQuery(
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

    // add exercises
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
  } */
}
