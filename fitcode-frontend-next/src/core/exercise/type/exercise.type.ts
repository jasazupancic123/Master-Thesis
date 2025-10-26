import type { AttributeValue } from '@/core/attribute/type/attribute-value.type';
import type { Component } from '@/core/component/type/component.type';
import type { BaseEntity } from '@/core/entity.type';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';

export type Exercise = BaseEntity &
  ExerciseAttributes & {
    ownerId: string;
    name: string;
    componentIds: string[];
    institutionId?: string;
    isUnilateral: boolean;
    disabled: boolean;
    params: ExerciseParamField[];
    imageUrl?: string;
    videoUrl?: string;
    instruction?: string;

    // mapped properties
    components?: Component[];
    rootComponents?: Component[];
  };

export type ExerciseAttributes = {
  categories: string[];
  equipment: string[];
  muscleValues?: AttributeValue[];
  prescriptions: string[];
  patterns: string[];
  bodyRegions: string[];
  loadingSides: string[];
  locations: string[];
  liftPriorities: string[];
  movementDirections: string[];
};

export type FilterExercises = Partial<Pick<Exercise, 'componentIds'>> &
  Partial<AttributeValue>;

export type CreateExercise = Pick<
  Exercise,
  | 'name'
  | 'componentIds'
  | 'isUnilateral'
  | 'disabled'
  | 'imageUrl'
  | 'videoUrl'
  | 'instruction'
  | 'muscleValues'
  | 'categories'
  | 'equipment'
  | 'prescriptions'
  | 'patterns'
  | 'bodyRegions'
  | 'loadingSides'
  | 'movementDirections'
  | 'locations'
  | 'liftPriorities'
>;

export type CreateExerciseMuscleValues = Pick<
  Exercise,
  'name' | 'muscleValues'
>;

export type CreateExerciseAttributeValue = AttributeValue;

export type UpsertManyExercises = {
  exercises: CreateExercise[];
};

export type UpsertManyMuscleValues = {
  exercises: CreateExerciseMuscleValues[];
};

export type UpdateExercise = Omit<CreateExercise, 'isUnilateral'>;
