import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';

export interface ExercisePageProps {
  token: string;
  exercises: Exercise[];
  attributes: ExerciseAttribute[];
  components: Component[];
}

export interface ExerciseContextProps extends ExercisePageProps {
  setExercises: SetState<Exercise[]>;
  setAttributes: SetState<ExerciseAttribute[]>;
}
