import dayjs from 'dayjs';

import { WellnessChartDataType } from '@/core/user/enum/wellness-chart-data-type.enum';
import type { User } from '@/core/user/type/user.type';
import type {
  WellnessChartData,
  WellnessZScore,
} from '@/core/user/type/wellness.type';
import type { SetState } from '@/lib/common/type/state.type';

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
          zScore: todayWellness?.zScoreFatigue ?? null,
          zScoreYesterday: yesterdayWellness?.zScoreFatigue ?? null,
        };
      }
      if (data.metric === WellnessChartDataType.SORENESS) {
        return {
          ...data,
          today: todayWellness?.soreness ?? null,
          yesterday: yesterdayWellness?.soreness ?? null,
          zScore: todayWellness?.zScoreSoreness ?? null,
          zScoreYesterday: yesterdayWellness?.zScoreSoreness ?? null,
        };
      }
      if (data.metric === WellnessChartDataType.SLEEP) {
        return {
          ...data,
          today: todayWellness?.sleep ?? null,
          yesterday: yesterdayWellness?.sleep ?? null,
          zScore: todayWellness?.zScoreSleep ?? null,
          zScoreYesterday: yesterdayWellness?.zScoreSleep ?? null,
        };
      }
      return data;
    })
  );
}
