import { BaseEntity } from '@/common/type/entity.type';
import { ExerciseAttributeValue } from './exercise-attribute-value.type';
import { Component } from '@/controller/component/type/component.type';

export type Exercise = BaseEntity & {
  userId: string;
  name: string;
  componentsIds: string[];
  global: boolean;
  imageUrl?: string;
  videoUrl?: string;
  values: ExerciseAttributeValue[];
  attributeValues: Record<string, any>;

  // mapped properties
  components?: Component[];
  rootComponents?: Component[];
};
