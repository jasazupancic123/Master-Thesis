import { useEffect, useState } from 'react';

import type { AthleteExerciseReportChartData } from '../types/athlete-exercise-report-chart-data';
import type { Workload } from '@/core/training/type/workload.type';

export default function useAthleteChartData() {
  const [data, setData] = useState<Workload[]>([]);
  const [chartData, setChartData] = useState<AthleteExerciseReportChartData[]>(
    []
  );

  useEffect(() => {
    // pre-procesing for averaging by training is in useAthleteExerciseReportData hook inside the header component
    setChartData(
      data
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .map((w, i) => {
          return {
            index: i,
            userId: w.userId,
            workloadId: w.id,
            trainingId: w.trainingId,
            date: new Date(w.timestamp),
            load: w.loadKg || 0,
            reps: w.reps || 0,
            loadR: w.loadKgR,
            repsR: w.repsR,
          };
        })
    );
  }, [data]);

  return {
    data,
    setData,
    chartData,
  };
}
