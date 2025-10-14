import type { ExerciseMembersInProgressProps } from '../exercise-members-in-progress';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function useExerciseMembersInProgress(
  props: ExerciseMembersInProgressProps
) {
  const { users } = useMain();
  const { progress } = useTrainerDayViewContext();

  const { trainingMembersLength, componentId, supersetIndex, exerciseId } =
    props;

  const exercises = progress.flatMap((p) =>
    p.exercises.map((e) => ({
      userId: p.userId,
      componentId: p.id,
      supersetIndex: e.supersetIndex,
      exerciseId: e.id,
      completedSets: e.completedSets,
    }))
  );

  const membersInProgress = exercises
    .filter(
      (p) =>
        p.componentId === componentId &&
        p.supersetIndex === supersetIndex &&
        p.exerciseId === exerciseId &&
        p.completedSets > 0
    )
    .map((p) => users.find((u) => u.uid === p.userId))
    .filter((u) => u !== undefined);

  const value = (membersInProgress.length / trainingMembersLength) * 100;

  return {
    value,
  };
}
