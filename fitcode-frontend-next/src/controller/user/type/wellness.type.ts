import type { WellnessChartDataType } from '../enum/wellness-chart-data-type.enum';

export interface Wellness {
  userId: string;
  date: Date;
  weight?: number;
  sleep?: number;
  fatigue?: number;
  soreness?: number;
  comment?: string;
}

export interface WellnessZScore extends Wellness {
  sleepZScore?: number;
  fatigueZScore?: number;
  sorenessZScore?: number;
}

export interface WellnessChartData {
  metric: WellnessChartDataType;
  today: number | null;
  zScore: number | null;
}

export type ChartDataWellness = Pick<
  Wellness,
  'fatigue' | 'sleep' | 'soreness'
>;

export type CreateWellness = Pick<
  Wellness,
  'date' | 'weight' | 'sleep' | 'fatigue' | 'soreness' | 'comment'
>;
