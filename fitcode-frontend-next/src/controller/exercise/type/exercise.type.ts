import { BaseEntity } from '@/common/type/entity.type';
import { ExerciseAttributeValue } from './exercise-attribute-value.type';
import { Component } from '@/controller/component/type/component.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export type Exercise = BaseEntity & {
  ownerId: string;
  name: string;
  componentIds: string[];
  imageUrl?: string;
  videoUrl?: string;
  instruction?: string;
  attributeValues: ExerciseAttributeValue[];
  defaultParams?: Attribute[];

  // mapped properties
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
  | 'imageUrl'
  | 'videoUrl'
  | 'instruction'
  | 'attributeValues'
>;

export type CreateExercises = {
  exercises: CreateExercise[];
};

export type UpdateExercise = CreateExercise;
