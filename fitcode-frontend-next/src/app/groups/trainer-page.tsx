'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import {
  IconButton,
  TextField,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import MyModal from '@/components/modal';
import SelectData from '@/components/select-data';
import FilterButton from '@/components/filter-button';
import { FilterType } from '@/common/type/filter.type';
import { User } from '@/controller/user/type/user.type';
import { CreateGroupInput, handleCreateGroup } from './state';
import { Add } from '@mui/icons-material';
import { Props } from './type';
import { useRouter } from 'next/navigation';
import { LINK_GROUP_BY_ID } from '@/common/constant/navigation.constant';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { Group } from '@/controller/group/type/group.type';

export default function TrainerPage(props: Props) {
  const { token, users, groups } = props;

  // state
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('day');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const theme = useTheme();
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
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          borderBottomLeftRadius: !selectedGroup ? '20px' : 0,
          borderBottomRightRadius: !selectedGroup ? '20px' : 0,
          pb: !selectedGroup ? 3 : 0,
        }}
      >
        {/* Date filter */}
        <Box mx="auto" justifyContent="center" mb={2}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, value: FilterType) =>
              setFilter((prev) => (!value ? prev : value))
            }
            sx={{ display: 'flex', bgcolor: '#1A2B3C', width: 300, mx: 'auto' }}
          >
            {(['day', 'week', 'cycle', 'year'] as FilterType[]).map((val) => (
              <FilterButton key={val} value={val} />
            ))}
          </ToggleButtonGroup>
        </Box>
        {!selectedGroup && (
          <Typography variant="h6" align="center">
            Select a group
          </Typography>
        )}
      </Box>
    </Box>
  );
}
