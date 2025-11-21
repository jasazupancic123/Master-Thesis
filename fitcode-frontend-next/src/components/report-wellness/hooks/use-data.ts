import { theme } from '@/app/style';
import { AuthUser } from '@/core/auth/type/user.type';
import { WellnessZScore } from '@/core/profile/type/wellness.type';
import { useMain } from '@/store/main.provider';
import dayjs from 'dayjs';
import { MetricConfig } from '../types/wellness-metrics.type';
import { WellnessChartRow } from '../types/wellness-chart-row';

export default function useWellnessReportData(
  members: AuthUser[],
  todaysWellness: WellnessZScore[],
  metricConfig: MetricConfig
) {
  const { wellness } = useMain();

  const rows = members
    .map((member) => {
      const row: WellnessChartRow = {};

      const memberWellness = todaysWellness.find(
        (w) => w.userId === member.uid
      );

      row.id = member.uid;
      row.label = member.displayName || member.email || 'Unknown';
      row.value = memberWellness ? memberWellness[metricConfig.key] : null;
      row.zScore = memberWellness ? memberWellness[metricConfig.zKey] : null;

      return row;
    })
    .sort((a, b) => {
      const aValue = a.value ?? -1;
      const bValue = b.value ?? -1;
      return aValue - bValue;
    });

  const last10DaysWellness = wellness.filter((w) => {
    return (
      dayjs(w.date).isAfter(dayjs().subtract(10, 'day'), 'day') &&
      members.some((m) => m.uid === w.userId)
    );
  });

  const last10DaysValues = last10DaysWellness
    .map((w) => w[metricConfig.key])
    .filter((v) => v != null && v !== undefined) as number[];

  const last10DayAvgValue =
    last10DaysValues.reduce((acc, val) => acc + val, 0) /
    (last10DaysValues.length > 0 ? last10DaysValues.length : 1);

  const todayValues = rows
    .map((r) => r.value)
    .filter((v): v is number => v != null && v !== undefined);

  const avgValue =
    todayValues.reduce((acc, val) => acc + val, 0) /
    (todayValues.length > 0 ? todayValues.length : 1);

  return {
    rows,
    avgValue,
    last10DayAvgValue,
  };
}
