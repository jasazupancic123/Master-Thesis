import { DateRange } from '@/common/type/date-range.type';
import { ColorEntity, IdEntity } from '@/common/type/entity.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Subgroup } from './subgroup.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { CopiedFrom } from '@/controller/component/type/copied-from.type';
import { Target } from '@/controller/target/type/target.type';
import { Method } from '@/controller/method/type/method.type';
import { AttributeRange } from '@/controller/attribute/type/attribute-range.entity';
import { SubgroupInfo } from './subggroup-minimal.type';
import { PeriodizationType } from '@/controller/group/enum/periodization-type.enum';

export type TrainingComponent = IdEntity &
  ColorEntity &
  Required<DateRange> & {
    supersets: Superset[];
    subgroups: Subgroup[];
    completedMembersIds: string[]; // members who completed the component
    methodId?: string;
    target?: Target; // selected target
    periodizationType?: PeriodizationType

    // mapped properties
    method?: Method;
    component?: Component;
    copiedFrom?: CopiedFrom; // used for copying components from other trainings
  };

export type TrainingComponentInfo = IdEntity &
  ColorEntity &
  Required<DateRange> & {
    subgroups: SubgroupInfo[];
    methodId?: string;

    // mapped properties
    method?: Method;
    target?: Target; // selected target
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
    attributeRanges: AttributeRange[];

    // mapped properties
    exercise?: Exercise;
  };

export interface ExerciseSet {
  setNumber: number;
  paramValuesL: AttributeValue[];
  paramValuesR: AttributeValue[];
}
