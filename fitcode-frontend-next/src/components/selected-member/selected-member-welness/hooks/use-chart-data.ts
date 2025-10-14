import { useEffect, useState } from 'react';

import setupChartData from '../actions/actions-chart-data';
import { WellnessChartDataType } from '@/controller/profile/enum/wellness-chart-data-type.enum';
import type { WellnessChartData } from '@/controller/profile/type/wellness.type';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function useSelectedMemberWellnessChartData() {
  const { wellness, selectedAthlete } = useTrainerDayViewContext();

  const [wellnessChartData, setWellnessChartData] = useState<
    WellnessChartData[]
  >(
    [
      WellnessChartDataType.SLEEP,
      WellnessChartDataType.SORENESS,
      WellnessChartDataType.FATIGUE,
    ].map((metric) => ({
      metric,
      today: null,
      zScore: null,
    }))
  );

  useEffect(() => {
    if (!selectedAthlete) return;

    setupChartData(wellness, selectedAthlete, setWellnessChartData);
  }, [selectedAthlete]);

  return {
    wellnessChartData,
    setWellnessChartData,
  };
}
