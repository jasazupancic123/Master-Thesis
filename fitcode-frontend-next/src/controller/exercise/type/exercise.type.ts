import { BaseEntity } from '@/common/type/entity.type';
import { ExerciseAttributeValue } from './exercise-attribute-value.type';
import { Component } from '@/controller/component/type/component.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';

export type Exercise = BaseEntity & {
  name: string;
  componentIds: string[];
  ownerId: string;
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
