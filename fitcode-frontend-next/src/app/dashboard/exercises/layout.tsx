import { ChildrenProps } from '@/common/type/props.type';
import ExerciseInitializer from '@/initializers/exercise.initializer';

export default function Layout({ children }: ChildrenProps) {
  return <ExerciseInitializer>{children}</ExerciseInitializer>;
}
