'use client';

import TrainerCycleView from '@/app/groups/[group_id]/trainer-group-cycle-view';
import TrainerDayView from '@/app/groups/[group_id]/trainer-group-day-view';
import TrainerWeekView from '@/app/groups/[group_id]/trainer-group-week-view';
import TrainerYearView from '@/app/groups/[group_id]/trainer-group-year-view';
import { GroupDateFilter } from '@/common/type/filter.type';
import GroupSidebar from '@/components/group-sidebar';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { TrainerDayViewProvider } from '@/context/trainer-day-view-provider';
import { Box, useTheme } from '@mui/material';
import { ReactNode } from 'react';
import GroupDateFilterButtonGroup from '../group-date-filter-button-group';
import { useAuth } from '@/context/auth-provider';
import Animation from '@/components/animation';

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

  return hasJustLoggedIn ? (
    <Animation
      text="PREPARING TRAINING PLAN"
      onEnd={() => setHasJustLoggedIn(false)}
    />
  ) : (
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
  );
}
