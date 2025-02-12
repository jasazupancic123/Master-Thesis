'use client';

import { Box, ToggleButtonGroup } from '@mui/material';
import { FilterTypeViewProps, GroupIdPageProps } from './type';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { FilterType } from '@/common/type/filter.type';
import FilterButton from '../../../components/filter-button';
import { ReactNode, useState } from 'react';
import TrainerYearView from '../../../components/trainer-year-view';
import TrainerCycleView from '@/components/trainer-cycle-view';
import { useScreenSize } from '@/context/screen-size-provider';
import { Cycle } from '@/controller/group/type/cycle.type';
import TrainerWeekView from '@/components/trainer-week-view';
import dayjs from 'dayjs';
import TrainerDayView from '@/components/trainer-day-view';

export default function TrainerPage(props: GroupIdPageProps) {
  const { group, groups, trainings } = props;

  const [filter, setFilter] = useState<FilterType>('day');
  const [selectedTrainings, setSelectedTrainings] = useState(() => trainings);
  const [selectedGroup, setSelectedGroup] = useState(() => group);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(
    () => group.cycles[0]
  );

  const [date, setDate] = useState({
    start: dayjs().startOf('year'),
    end: dayjs().endOf('year'),
    custom: false,
  });

  const newProps: FilterTypeViewProps = {
    ...props,
    group: selectedGroup,
    setSelectedGroup,
    trainings: selectedTrainings,
    setSelectedTrainings,
    selectedCycle,
    setSelectedCycle,
    date,
    setDate,
  };

  const mapper: Record<FilterType, ReactNode> = {
    day: <TrainerDayView {...newProps} />,
    week: <TrainerWeekView {...newProps} />,
    cycle: <TrainerCycleView {...newProps} />,
    year: <TrainerYearView {...newProps} />,
  };

  const screenSize = useScreenSize();

  return (
    <Box
      mt="16px"
      ml={screenSize.isLandscapeMobile || screenSize.isMobile ? '0' : '45px'}
      mx={screenSize.isLandscapeMobile || screenSize.isMobile ? 1 : undefined}
      pl={!screenSize.isLandscapeMobile && !screenSize.isMobile ? 2.25 : 0}
    >
      <TrainerGroupSidebar
        groups={groups}
        selectedGroup={selectedGroup}
        logout={async () => {
          console.log('Log out');
        }}
      />
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
        {/* Date filter */}
        <Box mx="auto" justifyContent="center" mb={2}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, val: FilterType) =>
              setFilter((prev) => (!val ? prev : val))
            }
            sx={{ display: 'flex', bgcolor: '#1A2B3C', width: 300, mx: 'auto' }}
          >
            {(['day', 'week', 'cycle', 'year'] as FilterType[]).map((val) => (
              <FilterButton key={val} value={val} />
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box>{mapper[filter]}</Box>
    </Box>
  );
}
