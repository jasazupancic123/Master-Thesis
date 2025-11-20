import { useEffect, useState } from 'react';

import type { AthleteExerciseReportChartData } from '../types/athlete-exercise-report-chart-data';
import type { Workload } from '@/core/training/type/workload.type';

export default function useAthleteChartData(
  reportType: 'single' | 'comparison'
) {
  const [data, setData] = useState<Workload[]>([]);
  const [allSetsData, setAllSetsData] = useState<Workload[]>([]); // contains data for all sets
  const [chartData, setChartData] = useState<AthleteExerciseReportChartData[]>(
    []
  );
  const trainingIds = Array.from(new Set(chartData.map((d) => d.trainingId)));

  const [range, setRange] = useState<number[]>([1, 10]); // Example range
  const max = reportType === 'single' ? data.length : trainingIds.length;

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

  useEffect(() => {
    if (reportType === 'single') {
      setRange([1, chartData.length]);
    } else if (reportType === 'comparison') {
      const uniqueTrainingIds = Array.from(
        new Set(chartData.map((d) => d.trainingId))
      );

      setRange([1, uniqueTrainingIds.length]);
    }
  }, [reportType, chartData]);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  return {
    data,
    setData,
    allSetsData,
    setAllSetsData,
    chartData,
    range,
    setRange,
    max,
    handleChange,
  };
}
