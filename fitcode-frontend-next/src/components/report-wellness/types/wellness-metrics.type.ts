import { WellnessZScore } from '@/core/profile/type/wellness.type';

export type WellnessMetric = 'sleep' | 'fatigue' | 'soreness';

export type MetricConfig = {
  key: WellnessMetric;
  zKey: keyof Pick<
    WellnessZScore,
    'zScoreSleep' | 'zScoreFatigue' | 'zScoreSoreness'
  >;
  title: string;
  unit?: string;
};

export type MetricData = {
  metric: WellnessMetric;
  title: string;
  data: {
    id?: string;
    label?: string;
    value?: number | null;
    zScore?: number | null;
  }[];
};
