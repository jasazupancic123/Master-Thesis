import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { CommonService } from '@/common/service/common.service';
import type { EventType } from '@/controller/group/enum/event-type.enum';
import { useGroup } from '@/store/group.provider';

export type UseWeekViewUtilsReturnType = ReturnType<typeof useWeekViewUtils>;

export default function useWeekViewUtils(commonService: CommonService) {
  const { cycle, setDateFrom, setDateTo } = useGroup();

  const [index, setIndex] = useState(0); // week index

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );

  const weeks = cycle
    ? commonService.date.weeks(cycle.from, cycle.to)
    : commonService.date.weeks(new Date(), dayjs().add(6, 'day').toDate());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    })
  );

  const disabledSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 999999 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 999999, tolerance: 999999 },
    })
  );

  useEffect(() => {
    if (!cycle) return;
    setIndex(0);
  }, [cycle]);

  useEffect(() => {
    if (weeks.length < 7) return;

    setDateFrom(dayjs(weeks[index][0].date));
    setDateTo(dayjs(weeks[index][6].date));
  }, [cycle, index]);

  return {
    weeks,
    index,
    setIndex,
    menuOpen,
    setMenuOpen,
    selectedEventType,
    setSelectedEventType,
    sensors,
    disabledSensors,
  };
}
