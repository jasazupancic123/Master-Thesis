import { useEffect, useState } from 'react';
import { v4 } from 'uuid';

import { INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID } from '@/components/report-athlete-exercise/const/index-db-id.const';
import type { AthleteExerciseReportType } from '@/components/report-athlete-exercise/types/athlete-exercise-report-type';
import type { IndexDbAthleteExerciseReport } from '@/components/report-athlete-exercise/types/index-db-athlete-exercise-report';
import { lib } from '@/lib';
import { useMain } from '@/store/main.provider';

export default function useAthleteExerciseReports() {
  const { institution } = useMain();

  const [athleteExerciseReports, setAthleteExercisesReports] = useState<
    AthleteExerciseReportType[]
  >([]);

  useEffect(() => {
    const setupReports = async () => {
      const items = await lib.common.indexedDb.items.get(
        INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID
      );

      const data: IndexDbAthleteExerciseReport[] = items?.payload;

      const filteredData = data.filter(
        (d) => d.institutionId === institution.id
      );

      if (filteredData && filteredData.length) {
        setAthleteExercisesReports(
          filteredData.map((item) => ({
            id: item.id,
            userId: item.userId || '',
            userIds: item.userIds || [],
            exerciseId: item.exerciseId,
            type: item.type,
          }))
        );

        return;
      }

      const id = v4();
      setAthleteExercisesReports([
        {
          id,
          userId: undefined,
          userIds: [],
          exerciseId: undefined,
          type: 'single',
        },
      ]);
    };

    setupReports();
  }, []);

  return {
    athleteExerciseReports,
    setAthleteExercisesReports,
  };
}
