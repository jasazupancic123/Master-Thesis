'use client';

import TrainerCycleView from '@/components/group-trainer-cycle-view/trainer-group-cycle-view';
import TrainerDayView from '@/components/group-trainer-day-view/trainer-group-day-view';
import TrainerWeekView from '@/components/group-trainer-week-view/trainer-group-week-view';
import TrainerYearView from '@/components/group-trainer-year-view/trainer-group-year-view';
import { GroupDateFilter } from '@/common/type/filter.type';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { TrainerDayViewProvider } from '@/store/trainer-day-view-provider';
import { Box, useTheme } from '@mui/material';
import { ReactNode } from 'react';
import GroupDateFilterButtonGroup from '../components/group-date-filter-button-group/group-date-filter-button-group';
import { useAuth } from '@/store/auth-provider';
import GroupSidebar from '@/components/group-sidebar/group-sidebar';

export default function TrainerGroupPage() {
  const screenSize = useScreenSize();
  const context = useGroup();
  const theme = useTheme();

  const { group, groups, filter, setFilter } = context;
  const { hasJustLoggedIn, setHasJustLoggedIn } = useAuth();

  const mapper: Record<GroupDateFilter, ReactNode> = {
    day: (
      <TrainerDayViewProvider {...context}>
        <TrainerDayView />
      </TrainerDayViewProvider>
    ),
    week: <TrainerWeekView />,
    cycle: <TrainerCycleView />,
    year: <TrainerYearView />,
  };

  return (
    <Box
      mt="5px"
      sx={{
        px: screenSize.isMobile ? 1 : '34px',
        overflowX: 'hidden',
      }}
      width="100%"
    >
      <GroupSidebar groups={groups} group={group} />

      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflowX: 'hidden',
          pb: 1,
        }}
      >
        <GroupDateFilterButtonGroup filter={filter} setFilter={setFilter} />
      </Box>

      <Box>{mapper[filter]}</Box>
    </Box>
  ); /* hasJustLoggedIn ? (
    <Animation
      text="PREPARING TRAINING PLAN"
      onEnd={() => setHasJustLoggedIn(false)}
    />
  ) : */
}
