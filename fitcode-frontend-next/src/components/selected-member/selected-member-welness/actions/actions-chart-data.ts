import dayjs from 'dayjs';

import { COLOR } from '@/common/constant/color.constant';
import type { SetState } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { WellnessChartDataType } from '@/controller/profile/enum/wellness-chart-data-type.enum';
import type {
  WellnessChartData,
  WellnessZScore,
} from '@/controller/profile/type/wellness.type';

export default function setupChartData(
  wellness: WellnessZScore[],
  selectedAthlete: AuthUser,
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
