'use client';

import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import GroupSidebar from '@/components/group-sidebar/group-sidebar';
import TrainerCycleView from '@/components/trainer-group-cycle-view/trainer-group-cycle-view';
import TrainerDayView from '@/components/trainer-group-day-view/trainer-group-day-view';
import TrainerWeekView from '@/components/trainer-group-week-view/trainer-group-week-view';
import { SliderCycleProvider } from '@/components/trainer-group-year-view/context/cycles.provider';
import { YearsSliderProvider } from '@/components/trainer-group-year-view/context/years.provider';
import TrainerYearView from '@/components/trainer-group-year-view/trainer-group-year-view';
import type { GroupDateFilter } from '@/lib/common/type/filter.type';
import { useGroup } from '@/store/group.provider';
import { TrainerDayViewProvider } from '@/store/trainer-day-view.provider';

export default function TrainerGroupPage() {
  const context = useGroup();
  const { filter } = context;

  const mapper: Record<GroupDateFilter, ReactNode> = {
    day: <TrainerDayView />,
    week: <TrainerWeekView />,
    month: <TrainerCycleView />,
    year: (
      <YearsSliderProvider>
        <SliderCycleProvider>
          <TrainerYearView />
        </SliderCycleProvider>
      </YearsSliderProvider>
    ),
  };

  return (
    <Box sx={{ overflowX: 'hidden' }} width="100%">
      {filter === 'day' ? (
        <TrainerDayViewProvider {...context}>
          <GroupSidebar />
          <Box mt="50px">{mapper[filter]}</Box>
        </TrainerDayViewProvider>
      ) : (
        <>
          <GroupSidebar />
          <Box mt="50px">{mapper[filter]}</Box>
        </>
      )}
    </Box>
  );
}
