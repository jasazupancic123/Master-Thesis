import { useEffect, useState } from 'react';

import type { DataGridWorkloadRow } from '../types/data-grid-workload-row';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { User } from '@/core/user/type/user.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useMain } from '@/store/main.provider';
import { useTrainingRecap } from '@/store/training-recap.provider';

export default function useTrainingRecapRows(
  selectedAthletes: User[],
  selectedExercises: Exercise[]
) {
  const { users, exercises } = useMain();
  const { workloads } = useTrainingRecap();

  const [rows, setRows] = useState<DataGridWorkloadRow[]>([]);

  const generateTempoString = (input: {
    tempoEcc: number | undefined;
    tempoIso: number | undefined;
    tempoCon: number | undefined;
    tempoIdle: number | undefined;
  }): string => {
    const { tempoEcc, tempoIso, tempoCon, tempoIdle } = input;

    if (!tempoEcc && !tempoIso && !tempoCon && !tempoIdle) return '-';

    return `${tempoEcc !== undefined ? tempoEcc : '-'}-${tempoIso !== undefined ? tempoIso : '-'}-${tempoCon !== undefined ? tempoCon : '-'}-${tempoIdle !== undefined ? tempoIdle : '-'}`;
  };

  useEffect(() => {
    setRows(
      workloads
        .map((workload) => {
          const user = users.data.find((u) => u.uid === workload.userId);
          const exercise = exercises.find((e) => e.id === workload.exerciseId);

          if (!user || !exercise) return undefined;

          return {
            id: workload.id,
            photoURL: user.photoURL || USER_AVATAR_IMG_URL,
            displayName: user.displayName || 'Unknown User',
            exerciseName: exercise.name || 'Unknown Exercise',
            setNumber: workload.setNumber,
            reps: workload.reps || 0,
            repsR: workload.repsR,
            load: workload.loadKg || 0,
            loadR: workload.loadKgR,
            tempo: generateTempoString({
              tempoCon: workload.tempoCon,
              tempoEcc: workload.tempoEcc,
              tempoIdle: workload.tempoIdle,
              tempoIso: workload.tempoIso,
            }),
            tempoR: generateTempoString({
              tempoCon: workload.tempoConR,
              tempoEcc: workload.tempoEccR,
              tempoIdle: workload.tempoIdleR,
              tempoIso: workload.tempoIsoR,
            }),
          } as DataGridWorkloadRow;
        })
        .filter((r) => r !== undefined)
        .filter((r) =>
          selectedAthletes.length
            ? selectedAthletes.some(
                (athlete) =>
                  athlete.uid === workloads.find((w) => w.id === r.id)?.userId
              )
            : true
        )
        .filter((r) =>
          selectedExercises.length
            ? selectedExercises.some(
                (exercise) =>
                  exercise.id ===
                  workloads.find((w) => w.id === r.id)?.exerciseId
              )
            : true
        )
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
        ) as DataGridWorkloadRow[]
    );
  }, [workloads, users, exercises, selectedAthletes, selectedExercises]);

  return {
    rows,
    setRows,
  };
}
