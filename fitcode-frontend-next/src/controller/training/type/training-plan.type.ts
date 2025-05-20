import { DateRange } from '@/common/type/date-range.type';
import { ColorEntity, IdEntity } from '@/common/type/entity.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Subgroup } from './subgroup.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { CopiedFrom } from '@/controller/component/type/copied-from.type';

export type TrainingComponent = IdEntity &
  ColorEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];

    // mapped properties
    completedMembersIds: string[]; // members who completed the component
    component?: Component;
    copiedFrom?: CopiedFrom; // used for copying components from other trainings
  };

export type Superset = ColorEntity & {
  exercises: TrainingExercise[];
};

export type TrainingExercise = IdEntity &
  ColorEntity & {
    params: Attribute[];
    sets: ExerciseSet[];
    periodized: boolean;

    // mapped properties
    exercise?: Exercise;
  };

export interface ExerciseSet {
  setNumber: number;
  paramValuesL: AttributeValue[];
  paramValuesR: AttributeValue[];
}
