import type { ExerciseMuscleValue } from './exercise-muscle-value.entity';
import type { AttributeValue } from '@/core/attribute/type/attribute-value.type';
import type { BaseEntity } from '@/core/entity.type';
import type { ExerciseParamFieldExtended } from '@/core/training/type/exercise-set.type';

export type Exercise = BaseEntity &
  ExerciseAttributes & {
    ownerId: string;
    name: string;
    disabled: boolean;
    institutionId?: string;
    imageUrl?: string;
    videoUrl?: string;
    instruction?: string;
  };

export type ExerciseAttributes = {
  isUnilateral: boolean;
  params: ExerciseParamFieldExtended[];
  muscleValues?: ExerciseMuscleValue[];
  components: string[];
  equipment: string[];
  prescriptions: string[];
  patterns: string[];
  bodyRegions: string[];
  loadingSides: string[];
  locations: string[];
  liftPriorities: string[];
  movementDirections: string[];
};

export type FilterExercises = Partial<Pick<Exercise, 'components'>> &
  Partial<AttributeValue>;

export type CreateExercise = Pick<
  Exercise,
  | 'name'
  | 'isUnilateral'
  | 'disabled'
  | 'imageUrl'
  | 'videoUrl'
  | 'instruction'
  | 'muscleValues'
  | 'components'
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
