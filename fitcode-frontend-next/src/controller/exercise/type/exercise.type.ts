import type { BaseEntity } from '@/common/type/entity.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { Component } from '@/controller/component/type/component.type';

export type Exercise = BaseEntity &
  ExerciseAttributes & {
    ownerId: string;
    name: string;
    componentIds: string[];
    institutionId?: string;
    isUnilateral: boolean;
    imageUrl?: string;
    videoUrl?: string;
    instruction?: string;
    defaultParams?: Attribute[];

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
