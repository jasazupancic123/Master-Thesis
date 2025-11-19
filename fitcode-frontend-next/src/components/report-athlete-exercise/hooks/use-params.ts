import { useEffect, useState } from 'react';

import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';

export default function useAthleteExerciseReportParams(data: Workload[]) {
  const [possibleParams, setPossibleParams] = useState<
    ('loadKg' | 'reps' | 'loadKgR' | 'repsR')[]
  >([]);
  const [selectedParams, setSelectedParams] = useState<
    ('loadKg' | 'reps' | 'loadKgR' | 'repsR')[]
  >([]);

  const [comparisonParam, setComparisonParam] = useState<
    'loadKg' | 'reps' | 'loadKgR' | 'repsR' | undefined
  >('loadKg');

  useEffect(() => {
    const params: ('loadKg' | 'reps' | 'loadKgR' | 'repsR')[] = [];

    const possibleParams = ['loadKg', 'reps', 'loadKgR', 'repsR'] as const;

    for (const param of possibleParams)
      if (data.some((d) => d[param] !== undefined)) params.push(param);

    setPossibleParams(params);
    setSelectedParams(params);
    setComparisonParam(params[0]);
  }, [data]);

  function getParamColor(param: 'loadKg' | 'reps' | 'loadKgR' | 'repsR') {
    if (param === 'loadKg') return theme.palette.primary.main;
    if (param === 'reps') return theme.palette.secondary.main;
    if (param === 'loadKgR') return theme.palette.success.main;
    if (param === 'repsR') return theme.palette.warning.main;

    return 'transparent';
  }

  const paramSeriesMap: Record<
    'loadKg' | 'reps' | 'loadKgR' | 'repsR',
    {
      dataKey: string;
      label: string;
      color: string;
    }
  > = {
    loadKg: {
      dataKey: 'load',
      label: 'Load (kg)',
      color: getParamColor('loadKg'),
    },
    reps: {
      dataKey: 'reps',
      label: 'Reps',
      color: getParamColor('reps'),
    },
    loadKgR: {
      dataKey: 'loadR',
      label: 'Load R (kg)',
      color: getParamColor('loadKgR'),
    },
    repsR: {
      dataKey: 'repsR',
      label: 'Reps R',
      color: getParamColor('repsR'),
    },
  };

  return {
    possibleParams,
    selectedParams,
    setSelectedParams,
    comparisonParam,
    setComparisonParam,
    paramSeriesMap,
    getParamColor,
  };
}
