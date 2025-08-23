import type { Theme } from '@mui/material';
import dayjs from 'dayjs';

import { COMMON_COLORS } from '@/common/constant/color.constant';
import type { SetState } from '@/common/type/state.type';
import { WellnessChartDataType } from '@/controller/user/enum/wellness-chart-data-type.enum';
import type { User } from '@/controller/user/type/user.type';
import type {
  WellnessChartData,
  WellnessZScore,
} from '@/controller/user/type/wellness.type';

export default function setupChartData(
  wellness: WellnessZScore[],
  selectedAthlete: User,
  setWellnessChartData: SetState<WellnessChartData[]>
) {
  const currentWellness =
    wellness.filter((w) => w.userId === selectedAthlete.uid) || [];

  const todayWellness = currentWellness.find((w) =>
    dayjs(w.date).isSame(dayjs(new Date()).startOf('day'), 'day')
  );
  const yesterdayWellness = currentWellness.find((w) =>
    dayjs(w.date).isSame(
      dayjs(new Date()).subtract(1, 'day').startOf('day'),
      'day'
    )
  );

  setWellnessChartData((prev) =>
    prev.map((data) => {
      if (data.metric === WellnessChartDataType.FATIGUE) {
        return {
          ...data,
          today: todayWellness?.fatigue ?? null,
          yesterday: yesterdayWellness?.fatigue ?? null,
          zScore: todayWellness?.fatigueZScore ?? null,
          zScoreYesterday: yesterdayWellness?.fatigueZScore ?? null,
        };
      }
      if (data.metric === WellnessChartDataType.SORENESS) {
        return {
          ...data,
          today: todayWellness?.soreness ?? null,
          yesterday: yesterdayWellness?.soreness ?? null,
          zScore: todayWellness?.sorenessZScore ?? null,
          zScoreYesterday: yesterdayWellness?.sorenessZScore ?? null,
        };
      }
      if (data.metric === WellnessChartDataType.SLEEP) {
        return {
          ...data,
          today: todayWellness?.sleep ?? null,
          yesterday: yesterdayWellness?.sleep ?? null,
          zScore: todayWellness?.sleepZScore ?? null,
          zScoreYesterday: yesterdayWellness?.sleepZScore ?? null,
        };
      }
      return data;
    })
  );
}

export const colorForZ = (metric: WellnessChartData, theme: Theme) => {
  let zValue = metric.zScore;
  if (zValue === null) return theme.palette.text.primary; // Default color if no z-score

  zValue = Math.abs(zValue);
  return zValue < 1
    ? COMMON_COLORS.blue
    : zValue < 2
      ? COMMON_COLORS.yellow
      : COMMON_COLORS.red;
};
