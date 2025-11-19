import { useMemo, useState } from 'react';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { AuthUser } from '@/core/auth/type/user.type';

export default function useAthleteExerciseReportExercises(
  selectedAthlete: AuthUser | null,
  passedExerciseId?: string
) {
  const { exercises } = useMain();
  const { trainings } = useDashboard();

  const athleteTrainings = selectedAthlete
    ? trainings.filter((t) =>
        t.membersIds.some((id) => id === selectedAthlete.uid)
      )
    : trainings;

  const uniqueExerciseIds = [
    ...new Set(
      athleteTrainings.flatMap((t) =>
        t.components.flatMap((c) => [
          ...c.supersets.flatMap((s) => s.exercises.map((e) => e.id)),
          ...c.subgroups.flatMap((sg) =>
            sg.supersets.flatMap((ss) => ss.exercises.map((e) => e.id))
          ),
        ])
      )
    ),
  ].filter((id, index, self) => index === self.findIndex((e) => e === id));

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
