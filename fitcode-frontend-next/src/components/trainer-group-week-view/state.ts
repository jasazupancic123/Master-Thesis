import type { DragEndEvent } from '@dnd-kit/core';
import type { SxProps, Theme } from '@mui/material';
import dayjs from 'dayjs';
import type { RefObject } from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import type { CommonService } from '@/common/service/common.service';
import type { SetState } from '@/common/type/state.type';
import type { EventType } from '@/controller/group/enum/event-type.enum';
import type { Week } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { GroupEvent } from '@/controller/group/type/group-event.type';
import type { Training } from '@/controller/training/type/training.type';
import { TrainingComponentWithTrainingId } from '@/controller/training/type/training-component.type';

const blurSelect = (selectRef: RefObject<HTMLDivElement | null>) => {
  if (selectRef.current) {
    const input = selectRef.current.querySelector(
      '.MuiSelect-select'
    ) as HTMLElement | null;
    input?.blur();
  }
};

export const getAmPmItems = (
  date: Date,
  state: {
    trainings: Training[];
    commonService: CommonService;
    group: Group;
  }
): {
  amItems: (TrainingComponentWithTrainingId | GroupEvent)[];
  pmItems: (TrainingComponentWithTrainingId | GroupEvent)[];
} => {
  const { group, trainings, commonService } = state;

  const day = dayjs(date);
  const filteredItems: (TrainingComponentWithTrainingId | GroupEvent)[] = [
    ...trainings
      .map((t) => t.components.map((c) => ({ ...c, trainingId: t.id })))
      .flat(),
    ...(group.events || []),
  ].filter((t) =>
    commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to))
  );

  if (!filteredItems.length) return { amItems: [], pmItems: [] };

  const amItems = filteredItems
    .filter((t) => dayjs(t.from).hour() < 12)
    .sort((a, b) => dayjs(a.from).valueOf() - dayjs(b.from).valueOf());
  const pmItems = filteredItems
    .filter((t) => dayjs(t.from).hour() >= 12)
    .sort((a, b) => dayjs(a.from).valueOf() - dayjs(b.from).valueOf());

  return { amItems, pmItems };
};

export const onDragEndAddEvent = (
  e: DragEndEvent,
  state: {
    selectedEventType: EventType | null;
    setSelectedEventType: SetState<EventType | null>;
    setGroup: SetState<Group>;
    weeks: Week[][];
    index: number;
    selectRef: RefObject<HTMLDivElement | null>;
    trainings: Training[];
    commonService: CommonService;
    group: Group;
  }
) => {
  const { over, active } = e;
  const {
    selectedEventType,
    setSelectedEventType,
    setGroup,
    weeks,
    index,
    selectRef,
    trainings,
    commonService,
    group,
  } = state;

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

export const customScrollBarStyle = (theme: Theme): SxProps => {
  return {
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.palette.background.default, // track color
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.text.disabled, // thumb color
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: theme.palette.text.disabled, // thumb hover
    },

    /* Firefox */
    scrollbarWidth: 'thin', // "auto" | "thin" | "none"
    scrollbarColor: `${theme.palette.text.disabled} ${theme.palette.background.default}`,
  };
};
