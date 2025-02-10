'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import {
  IconButton,
  TextField,
  ToggleButtonGroup,
  Tooltip,
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

  // create group
  const [openCreateGroupModal, setOpenCreateGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState<CreateGroupInput>({
    name: '',
    membersIds: [],
  });

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

        {/* Add new group */}
        <Box pl={3}>
          <Tooltip title="Add group">
            <IconButton
              onClick={() => setOpenCreateGroupModal(true)}
              sx={{ height: 50, width: 50 }}
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Create group modal */}
        <MyModal
          isOpen={openCreateGroupModal}
          setIsOpen={(open) => setOpenCreateGroupModal(open)}
          onCancel={() => setOpenCreateGroupModal(false)}
          onConfirm={async () => {
            const item = await handleCreateGroup(
              props.token,
              newGroup,
              setNewGroup,
              setOpenCreateGroupModal
            );

            if (item) router.push(LINK_GROUP_BY_ID(item.id).href);
          }}
        >
          <Typography variant="h6" mb={2}>
            Create Group
          </Typography>

          <Box mt={2} />

          <TextField
            sx={{ mb: 2 }}
            label="Name"
            fullWidth
            value={newGroup.name || ''}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
          />

          <SelectData<User>
            multiple
            data={props.users || []}
            dataKeyProp="uid"
            dataValueProp="email"
            label="Members"
            value={newGroup.membersIds}
            onChange={(membersIds) => setNewGroup({ ...newGroup, membersIds })}
          />
        </MyModal>
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
  );
}
