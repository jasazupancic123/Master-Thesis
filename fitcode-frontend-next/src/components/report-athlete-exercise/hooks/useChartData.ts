import { Workload } from '@/core/training/type/workload.type';
import { useEffect, useState } from 'react';
import { AthleteExerciseReportChartData } from '../types/athlete-exercise-report-chart-data';
import { theme } from '@/app/style';
import { useMain } from '@/store/main.provider';

export default function useAthleteChartData() {
  const { users } = useMain();

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

  const trainingIds = Array.from(new Set(chartData.map((d) => d.trainingId)));

  // All distinct users in the dataset
  const userIds = Array.from(new Set(chartData.map((d) => d.userId)));

  // Simple color palette per user
  const userColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  const comparisonSeries = userIds.map((userId, idx) => {
    const userName = users.find((u) => u.uid === userId)?.displayName;

    return {
      id: userId,
      label: userName || `User ${idx + 1}`, // or look up a name somewhere
      data: trainingIds.map((trainingId) => {
        const row = chartData.find(
          (d) => d.trainingId === trainingId && d.userId === userId
        );
        // choose which metric you want to compare; here I use `load`
        return row?.load ?? null;
      }),
      showMark: true,
      color: userColors[idx % userColors.length],
    };
  });

  return {
    data,
    setData,
    chartData,
    trainingIds,
    comparisonSeries,
  };
}
