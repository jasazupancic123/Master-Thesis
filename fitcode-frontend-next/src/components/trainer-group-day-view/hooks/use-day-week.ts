import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

const commonService = CommonService.instance;

export default function useTrainerDayWeek() {
  const { cycle, setDateFrom, setDateTo } = useGroup();

  const { day } = useTrainerDayViewContext();

  const [week, setWeek] = useState<number>(1);

  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label,
      value: date.toString(),
      sublabel: commonService.date.format(date, {
        withYear: false,
        withMonth: false,
        withoutDots: true,
      }),
    }))
  );

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

  return {
    week,
    setWeek,
    days,
    setDays,
  };
}
