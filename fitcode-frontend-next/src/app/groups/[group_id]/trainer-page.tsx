'use client';

import { GroupDateFilter } from '@/common/type/filter.type';
import GroupSidebar from '@/components/group-sidebar';
import TrainerCycleView from '@/components/trainer-cycle-view';
import TrainerDayView from '@/components/trainer-day-view';
import TrainerWeekView from '@/components/trainer-week-view';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, ToggleButtonGroup } from '@mui/material';
import { ReactNode } from 'react';
import FilterButton from '../../../components/filter-button';
import TrainerYearView from '../../../components/trainer-year-view';
import GroupDateFilterButtonGroup from '../group-date-filter-button-group';
import { GroupIdPageProps } from './props';

export default function TrainerPage(props: GroupIdPageProps) {
  const screenSize = useScreenSize();
  const context = useGroup();

  const { group, groups } = props;
  const { filter, setFilter } = context;
  const groupContextProps = { ...props, ...context };

  const mapper: Record<GroupDateFilter, ReactNode> = {
    day: <TrainerDayView {...groupContextProps} />,
    week: <TrainerWeekView {...groupContextProps} />,
    cycle: <TrainerCycleView {...groupContextProps} />,
    year: <TrainerYearView {...groupContextProps} />,
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
