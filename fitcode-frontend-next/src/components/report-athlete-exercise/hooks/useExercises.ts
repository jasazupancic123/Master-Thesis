import { AuthUser } from '@/core/auth/type/user.type';
import { Exercise } from '@/core/exercise/type/exercise.type';
import { Group } from '@/core/group/type/group.type';
import { Workload } from '@/core/training/type/workload.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useMemo, useState } from 'react';

export default function useAthleteExerciseReportExercises(
  passedExerciseId?: string
) {
  const { exercises } = useMain();
  const { trainings } = useDashboard();

  const uniqueExerciseIds = [
    ...new Set(
      trainings.flatMap((t) =>
        t.components.flatMap((c) => [
          ...c.supersets.flatMap((s) => s.exercises.map((e) => e.id)),
          ...c.subgroups.flatMap((sg) =>
            sg.supersets.flatMap((ss) => ss.exercises.map((e) => e.id))
          ),
        ])
      )
    ),
  ];

  const exercisesToSelect: Exercise[] = uniqueExerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => !!e);

  const [searchExercisesText, setSearchExercisesText] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    passedExerciseId
      ? exercisesToSelect.find((e) => e.id === passedExerciseId) || null
      : exercisesToSelect[0] || null
  );

  const filteredExercises = useMemo<Exercise[]>(() => {
    if (searchExercisesText.trim() === '') return exercisesToSelect;

    const lowerSearch = searchExercisesText.toLowerCase();
    return exercisesToSelect.filter((exercise) =>
      exercise.name.toLowerCase().includes(lowerSearch)
    );
  }, [exercisesToSelect, searchExercisesText]);

  return {
    exercisesToSelect,
    selectedExercise,
    setSelectedExercise,
    filteredExercises,
    searchExercisesText,
    setSearchExercisesText,
  };
}
