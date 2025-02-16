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
import { Box } from '@mui/material';
import { ReactNode } from 'react';
import GroupDateFilterButtonGroup from '../group-date-filter-button-group';

export default function TrainerGroupPage() {
  const screenSize = useScreenSize();
  const context = useGroup();

  const { group, groups, filter, setFilter } = context;

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
      mt="16px"
      ml={screenSize.isLandscapeMobile || screenSize.isMobile ? '0' : undefined}
      mx={screenSize.isLandscapeMobile || screenSize.isMobile ? 1 : undefined}
    >
      <GroupSidebar groups={groups} group={group} />

      <Box
        bgcolor="background.paper"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
        }}
      >
        <GroupDateFilterButtonGroup filter={filter} setFilter={setFilter} />
      </Box>

      <Box>{mapper[filter]}</Box>
    </Box>
  );
}
