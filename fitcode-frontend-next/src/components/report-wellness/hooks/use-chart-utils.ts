import { INVALID_Z_SCORE } from '../const/invalid-z-score';
import type { WellnessChartRow } from '../types/wellness-chart-row';
import { theme } from '@/app/style';

export default function useWellnessChartUtils(
  rows: WellnessChartRow[],
  width: number
) {
  // Build color map per label based on zScore
  const colorMapValues = rows.map((r) => r.label ?? '');
  const colorMapColors = rows.map((r) => {
    const z = r.zScore;

    // Fallback: keep default series color if no zScore or 0
    if (z === null || z === undefined || z === INVALID_Z_SCORE)
      return theme.palette.primary.main;

    if (z <= -2) return theme.palette.error.main;
    if (z <= -1) return theme.palette.warning.main;

    return theme.palette.success.main;
  });

  const containersWidth = width * 1.1;

  return {
    colorMapValues,
    colorMapColors,
    containersWidth,
  };
}
