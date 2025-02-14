'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FilterButton from '@/components/filter-button';
import { FilterType } from '@/common/type/filter.type';
import { Props } from './type';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { Group } from '@/controller/group/type/group.type';
import MyModal from '@/components/modal';
import { Add } from '@mui/icons-material';
import { CreateGroupInput, handleCreateGroup } from './state';
import {
  IconButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
} from '@mui/material';

export default function TrainerPage(props: Props) {
  const { groups } = props;
  const theme = useTheme();

  // state
  const [filter, setFilter] = useState<FilterType>('day');
  const [selectedGroup] = useState<Group | null>(null);
  const [openCreateGroupModal, setOpenCreateGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState<CreateGroupInput>({
    name: '',
    membersIds: [],
  });

  return (
    <Box mt="16px">
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

        {!selectedGroup && (
          <Typography variant="h6" textAlign="center" mt={2} p={2}>
            Select a group
          </Typography>
        )}

        {/* Create group modal */}
        <MyModal
          isOpen={openCreateGroupModal}
          setIsOpen={(open) => setOpenCreateGroupModal(open)}
          onCancel={() => setOpenCreateGroupModal(false)}
          onConfirm={async () => {
            await handleCreateGroup(
              props.token,
              newGroup,
              setNewGroup,
              setOpenCreateGroupModal
            );
          }}
        >
          <Typography variant="h6" mb={2}>
            Create Group
          </Typography>
        </MyModal>
      </Box>
    </Box>
  );
}
