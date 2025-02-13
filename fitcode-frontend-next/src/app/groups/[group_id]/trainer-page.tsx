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
import { Training } from '@/controller/training/type/training.type';

export default function TrainerPage(props: GroupIdPageProps) {
  const { group, groups, trainings } = props;

  const screenSize = useScreenSize();
  const [filter, setFilter] = useState<FilterType>('day');
  const [selectedTrainings, setSelectedTrainings] = useState(() => trainings);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );

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
    selectedTraining,
    setSelectedTraining,
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

  return (
    <Box
      mt="16px"
      ml={screenSize.isLandscapeMobile || screenSize.isMobile ? '0' : undefined}
      mx={screenSize.isLandscapeMobile || screenSize.isMobile ? 1 : undefined}
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
          <Box mx="auto" justifyContent="center" mb={2}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(_, val: FilterType) =>
                setFilter((prev) => (!val ? prev : val))
              }
              sx={{
                display: 'flex',
                bgcolor: 'background.default',
                width: 700,
                mx: 'auto',
                borderBottomLeftRadius: '500px',
                borderBottomRightRadius: '500px',
              }}
            >
              {(['day', 'week', 'cycle', 'year'] as FilterType[]).map((val) => (
                <FilterButton key={val} value={val} />
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      <Box>{mapper[filter]}</Box>
    </Box>
  );
}
