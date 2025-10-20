import type { DragEndEvent } from '@dnd-kit/core';
import dayjs from 'dayjs';
import type { RefObject } from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import type { UseWeekViewUtilsReturnType } from '../hooks/use-utils';
import { getAmPmItems } from './actions-items';
import type { CommonService } from '@/lib/common/common.service';
import type { IGroupCtx } from '@/store/group.provider';

export const onDragEndAddEvent = (
  input: {
    e: DragEndEvent;
    selectRef: RefObject<HTMLDivElement | null>;
    commonService: CommonService;
  },
  context: {
    useGroup: IGroupCtx;
    useWeekUtils: UseWeekViewUtilsReturnType;
  }
) => {
  const { selectRef, e, commonService } = input;
  const { over, active } = e;

  const { useGroup, useWeekUtils } = context;

  const { setGroup, trainings, group } = useGroup;

  const { selectedEventType, setSelectedEventType, weeks, index } =
    useWeekUtils;

  if (!over || !active?.data?.current?.eventType || !selectedEventType) return;

  const period = over.id.toString().split('-')[0];
  if (period !== 'AM' && period !== 'PM') return;

  const stringIndex = over.id.toString().split('-')[1];
  if (!stringIndex) return;

  const numericIndex = parseInt(stringIndex, 10);
  if (isNaN(numericIndex)) return;

  const day = weeks[index][numericIndex];
  if (!day) return;

  const date = day.date;
  const { amItems, pmItems } = getAmPmItems(date, {
    trainings,
    commonService,
    group,
  });

  const periodItems = period === 'AM' ? amItems : pmItems;
  let fromDate = !periodItems.length
    ? null
    : periodItems.reduce((acc, curr) => {
        return dayjs(curr.to).isAfter(dayjs(acc.to)) ? curr : acc;
      })?.to;

  if (!fromDate)
    fromDate =
      period === 'AM'
        ? dayjs(date).set('hour', 7).toDate()
        : dayjs(date).set('hour', 14).toDate();

  if (period === 'AM' && dayjs(fromDate).hour() === 12) {
    toast.error('No available time slot in AM');
    return;
  } else if (period === 'PM' && dayjs(fromDate).hour() === 0) {
    toast.error('No available time slot in PM');
    return;
  }

  let toDate = dayjs(fromDate).add(30, 'minutes').toDate();
  if (
    period === 'AM' &&
    dayjs(toDate).minute() > 0 &&
    dayjs(toDate).hour() >= 12
  )
    toDate = dayjs(toDate).set('hour', 12).set('minute', 0).toDate();
  else if (period === 'PM' && dayjs(toDate).hour() === 0)
    toDate = dayjs(toDate).set('hour', 23).set('minute', 59).toDate();

  const newEvent = {
    id: v4(),
    title: selectedEventType,
    from: fromDate,
    to: toDate,
  };

  blurSelect(selectRef);

  setGroup((prev) => ({
    ...prev,
    events: [...(prev.events || []), newEvent],
  }));

  setSelectedEventType(null);
};

const blurSelect = (selectRef: RefObject<HTMLDivElement | null>) => {
  if (selectRef.current) {
    const input = selectRef.current.querySelector(
      '.MuiSelect-select'
    ) as HTMLElement | null;
    input?.blur();
  }
};
