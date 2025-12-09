import type { LineSeries } from '@mui/x-charts';
import { useEffect, useState } from 'react';

import { LOAD_Y_AXIS_ID, REPS_Y_AXIS_ID } from '../athlete-exercise-report';
import type { AthleteExerciseReportChartData } from '../types/athlete-exercise-report-chart-data';
import { theme } from '@/app/style';
import { useMain } from '@/store/main.provider';

export default function useAthleteChartSeries(
  reportType: 'single' | 'comparison',
  chartData: AthleteExerciseReportChartData[],
  selectedParams: ('loadKg' | 'reps' | 'loadKgR' | 'repsR')[],
  possibleParams: ('loadKg' | 'reps' | 'loadKgR' | 'repsR')[],
  comparisonParam: 'loadKg' | 'reps' | 'loadKgR' | 'repsR' | undefined,
  paramSeriesMap: Record<
    'loadKg' | 'reps' | 'loadKgR' | 'repsR',
    {
      dataKey: string;
      label: string;
      color: string;
    }
  >,
  getParamColor: (param: 'loadKg' | 'reps' | 'loadKgR' | 'repsR') => string,
  range: number[]
) {
  const { users } = useMain();

  const userIds = Array.from(new Set(chartData.map((d) => d.userId)));
  const userColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  const trainingIds = Array.from(new Set(chartData.map((d) => d.trainingId)));

  const [singleModeSeries, setSingleModeSeries] = useState<LineSeries[]>([]);
  const [comparisonSeries, setComparisonSeries] = useState<LineSeries[]>([]);

  useEffect(() => {
    if (reportType === 'single') {
      const newSeries = selectedParams
        .filter((p) => possibleParams.includes(p))
        .map((param) => {
          const cfg = paramSeriesMap[param];

          const yAxisId = ['reps', 'repsR'].includes(param)
            ? REPS_Y_AXIS_ID
            : LOAD_Y_AXIS_ID;

          return {
            dataKey: cfg.dataKey,
            yAxisId: yAxisId,
            label: cfg.label,
            showMark: true,
            color: getParamColor(param),
          };
        });

      setSingleModeSeries(newSeries);
    } else {
      const selectedParam = comparisonParam || 'loadKg';

      const newComparisonSeries = userIds.map((userId, idx) => {
        const userName = users.data.find((u) => u.uid === userId)?.displayName;

        const filteredTrainingIds = trainingIds.slice(range[0] - 1, range[1]);

        return {
          id: userId,
          label: userName || `User ${idx + 1}`,
          data:
            selectedParam === 'loadKg'
              ? filteredTrainingIds.map((trainingId) => {
                  const row = chartData.find(
                    (d) => d.trainingId === trainingId && d.userId === userId
                  );

                  return row?.load ?? null;
                })
              : selectedParam === 'reps'
                ? filteredTrainingIds.map((trainingId) => {
                    const row = chartData.find(
                      (d) => d.trainingId === trainingId && d.userId === userId
                    );

                    return row?.reps ?? null;
                  })
                : selectedParam === 'loadKgR'
                  ? filteredTrainingIds.map((trainingId) => {
                      const row = chartData.find(
                        (d) =>
                          d.trainingId === trainingId && d.userId === userId
                      );

                      return row?.loadR ?? null;
                    })
                  : selectedParam === 'repsR'
                    ? filteredTrainingIds.map((trainingId) => {
                        const row = chartData.find(
                          (d) =>
                            d.trainingId === trainingId && d.userId === userId
                        );

                        return row?.repsR ?? null;
                      })
                    : undefined,
          showMark: true,
          color: userColors[idx % userColors.length],
        };
      });

      setComparisonSeries(newComparisonSeries);
    }
  }, [selectedParams, comparisonParam, reportType, range]);

  return {
    singleModeSeries,
    comparisonSeries,
    trainingIds,
  };
}
