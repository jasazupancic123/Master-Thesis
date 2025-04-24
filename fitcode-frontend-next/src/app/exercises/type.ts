import { SetState } from '@/common/type/state.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';

export interface ExercisePageProps {
  token: string;
  exercises: Exercise[];
  attributes: Attribute[];
  components: Component[];
}

export interface ExerciseContextProps extends ExercisePageProps {
  setExercises: SetState<Exercise[]>;
  setAttributes: SetState<Attribute[]>;
}
