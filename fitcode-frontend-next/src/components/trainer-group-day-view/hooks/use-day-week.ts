import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { lib } from '@/lib';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useTrainerDayWeek() {
  const [week, setWeek] = useState<number>(1);

  const { day } = useTrainerDayView();
  const { cycle, setDateFrom, setDateTo } = useGroup();

  const [days, setDays] = useState(
    lib.common.date.getWeekDays().map(({ label, date }) => ({
      label,
      value: date.toString(),
      sublabel: lib.common.date.format(date, {
        withYear: false,
        withMonth: false,
        withoutDots: true,
      }),
    }))
  );

  /**
   * Sets the date range based on the selected day
   * and calculates the current week in the cycle.
   */
  useEffect(() => {
    setDateFrom(day.date.startOf('day'));
    setDateTo(day.date.endOf('day'));
    if (!cycle?.from) return;

    const cycleStart = dayjs(cycle.from).startOf('day');
    const cycleWeek = cycleStart.week();
    const currentWeek = day.date.subtract(1, 'day').week();
    const diff = currentWeek - cycleWeek + 1;

    setWeek(diff);
  }, [day, cycle]);

  return { week, setWeek, days, setDays };
}
