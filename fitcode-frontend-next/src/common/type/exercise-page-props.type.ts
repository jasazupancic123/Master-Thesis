import type { SetState } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';

export interface ExercisePageProps {
  exercises: Exercise[];
  attributes: Attribute[];
  components: Component[];
}

export interface ExerciseContextProps extends ExercisePageProps {
  setExercises: SetState<Exercise[]>;
  setAttributes: SetState<Attribute[]>;
}
