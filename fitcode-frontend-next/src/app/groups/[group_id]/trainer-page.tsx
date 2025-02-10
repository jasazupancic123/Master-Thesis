'use client';

import { Box, ToggleButtonGroup } from '@mui/material';
import { GroupIdPageProps } from './type';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { FilterType } from '@/common/type/filter.type';
import FilterButton from '../components/filter-button';
import { ReactNode, useState } from 'react';
import TrainerYearView from '../../../components/trainer-year-view';

export default function TrainerPage(props: GroupIdPageProps) {
  const { token, groupId, users, groups, exercises, attributes, components } =
    props;

  const [filter, setFilter] = useState<FilterType>('day');
  const selectedGroup = groups.find((g) => g.id === groupId)!;

  const mapper: Record<FilterType, ReactNode> = {
    day: 'Day',
    week: 'Week',
    cycle: 'Cycle',
    year: <TrainerYearView {...props} />,
  };

  return (
    <Box mt="16px" ml="45px">
      <TrainerGroupSidebar
        groups={groups}
        selectedGroup={selectedGroup}
        logout={async () => {
          console.log('Log out');
        }}
      />

      <Box
        bgcolor="background.paper"
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

        <Box
          sx={{
            backgroundColor: '#1A2B3C',
            height: '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderTopRightRadius: '0px',
            borderTopLeftRadius: '0px',
            borderBottomRightRadius: '20px',
            borderBottomLeftRadius: '20px',
          }}
        />
      </Box>

      <Box>{mapper[filter]}</Box>
    </Box>
  );
}
