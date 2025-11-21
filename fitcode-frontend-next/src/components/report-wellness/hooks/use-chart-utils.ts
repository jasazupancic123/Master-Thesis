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
    if (z === null || z === undefined) return theme.palette.primary.main;

    if (z <= -2) return theme.palette.error.main;
    if (z <= -1) return theme.palette.warning.main;

    return theme.palette.success.main;
  });

  // helper somewhere in the file (outside the component)
  const wrapLabel = (value: string, maxCharsPerLine = 10) => {
    if (!value) return '';

    const words = value.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const tentative = current ? `${current} ${word}` : word;

      if (tentative.length > maxCharsPerLine) {
        if (current) lines.push(current);
        // If a single word is longer than maxCharsPerLine, just push it as its own line
        current = word;
      } else {
        current = tentative;
      }
    }

    if (current) lines.push(current);

    // MUI X Charts understands '\n' in tick labels and renders them as multiple lines
    return lines.join('\n');
  };

  const containersWidth = width * 1.1;

  return {
    colorMapValues,
    colorMapColors,
    wrapLabel,
    containersWidth,
  };
}
