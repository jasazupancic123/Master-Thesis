import type { ExerciseAttributeValue } from './exercise-attribute-value.type';
import type { BaseEntity } from '@/common/type/entity.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { Component } from '@/controller/component/type/component.type';

export type Exercise = BaseEntity & {
  ownerId: string;
  name: string;
  componentIds: string[];
  isUnilateral: boolean;
  imageUrl?: string;
  videoUrl?: string;
  instruction?: string;
  attributeValues: ExerciseAttributeValue[];
  defaultParams?: Attribute[];
  muscleValues?: AttributeValue[];

  // mapped properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valuesObject: Record<string, any>;
  components?: Component[];
  rootComponents?: Component[];
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
  | 'attributeValues'
  | 'muscleValues'
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
