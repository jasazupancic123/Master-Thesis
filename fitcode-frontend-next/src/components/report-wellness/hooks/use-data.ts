import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { INVALID_Z_SCORE } from '../const/invalid-z-score';
import type { WellnessChartRow } from '../types/wellness-chart-row';
import type { MetricConfig } from '../types/wellness-metrics.type';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
import { useMain } from '@/store/main.provider';

export default function useWellnessReportData(
  members: AuthUser[],
  todaysWellness: WellnessZScore[],
  metricConfig: MetricConfig
) {
  const { wellness } = useMain();

  const [rows, setRows] = useState<WellnessChartRow[]>([]);
  const [avgValue, setAvgValue] = useState<number>(0);
  const [last10DayAvgValue, setLast10DayAvgValue] = useState<number>(0);

  // -------- TODAY / ROWS --------
  useEffect(() => {
    const newRows: WellnessChartRow[] = [];

    for (const member of members) {
      const memberWellness = todaysWellness.find(
        (w) => w.userId === member.uid
      );

      const rawValue = memberWellness
        ? (memberWellness[metricConfig.key] as unknown)
        : null;

      const numericValue =
        rawValue === null || rawValue === undefined ? null : Number(rawValue);

      // Skip invalid numbers (null, undefined, NaN, Infinity, etc.)
      if (numericValue === null || !Number.isFinite(numericValue)) {
        continue;
      }

      const rawZ = memberWellness
        ? (memberWellness[metricConfig.zKey] as unknown)
        : null;
      const numericZ =
        rawZ === null || rawZ === undefined ? INVALID_Z_SCORE : Number(rawZ);

      const row: WellnessChartRow = {
        id: member.uid,
        label: member.displayName || member.email || 'Unknown',
        value: numericValue,
        zScore: Number.isFinite(numericZ) ? numericZ : INVALID_Z_SCORE,
      };

      newRows.push(row);
    }

    newRows.sort((a, b) => a.value - b.value);

    const values = newRows.map((r) => r.value);
    const avg =
      values.length > 0
        ? values.reduce((acc, val) => acc + val, 0) / values.length
        : 0;

    setRows(newRows);
    setAvgValue(avg);
  }, [members, todaysWellness, metricConfig]);

  useEffect(() => {
    const last10DaysWellness = wellness.filter((w) => {
      return (
        dayjs(w.date).isAfter(dayjs().subtract(10, 'day'), 'day') &&
        members.some((m) => m.uid === w.userId)
      );
    });

    const last10DaysValues = last10DaysWellness
      .map((w) => Number(w[metricConfig.key] as unknown))
      .filter((v) => Number.isFinite(v));

    const newLast10DayAvgValue =
      last10DaysValues.length > 0
        ? last10DaysValues.reduce((acc, val) => acc + val, 0) /
          last10DaysValues.length
        : 0;

    setLast10DayAvgValue(newLast10DayAvgValue);
  }, [wellness, members, metricConfig]);

  return {
    rows,
    avgValue,
    last10DayAvgValue,
  };
}
