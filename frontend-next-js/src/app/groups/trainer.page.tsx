'use client'

import Grid from '@mui/material/Unstable_Grid2';
import React, { useEffect, useState } from 'react';
import { GroupPage } from './group-page.type';
import Box from '@mui/material/Box';
import { Alert, Chip, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MyModal from '@/component/modal';
import { CreateGroup, Group } from '@/type/group.type';
import { fetcher } from '@/util/fetcher';
import { AppContextType, useAppContext } from '@/context/app-provider';
import toast from 'react-hot-toast';
import { useFetch } from '@/hook/use-fetch';
import GroupGrid from '@/component/group-grid';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/AddOutlined';
import { useRouter } from 'next/navigation';

export default function TrainerPage(props: GroupPage) {
  // router
  const router = useRouter()

  // context
  const { token } = useAppContext() as AppContextType
  const {users} = props;
  const [modal, setModal] = useState({ group: false });

  // filter users by email
  const [search, setSearch] = useState({ email: '' });
  const [filtered, setFiltered] = useState(users);

  /**
   * Groups
   */
  // group to create or update
  const [group, setGroup] = useState<CreateGroup>({
    name: '',
    memberIds: []
  });

  // all groups for user
  const [groups, loadingGroups, errorGroups, ___, setGroups] = useFetch<Group[]>('/group');

  // filter users by email
  useEffect(() => {
    if (!search.email) setFiltered(users);
    setFiltered(users.filter(user => user.email.includes(search.email)));
  }, [search]);

  /**
   * Create group
   */
  async function createGroup(group: CreateGroup) {
    try {
      const response = await fetcher<Group>('/group', { method: 'POST', body: group, token });
      toast.success('Successfully created group');

      setModal({ ...modal, group: false });
      setGroups([...groups, response]);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <>
      <Grid container spacing={2}>
        {/* Groups */}
        <Grid xs={12} sm={8}>
          {/* Group list */}
          <Box display='flex' alignItems='center' mb={2}>
            <Typography variant='h6' mr={2}>Groups</Typography>
          </Box>

          {!loadingGroups && !errorGroups &&
            <GroupGrid
              groups={groups}
              setGroups={setGroups}
              onClick={group => {
                router.push(`/groups/${group.id}`)
              }}
            />
          }
        </Grid>

        {/* Athletes list */}
        <Grid xs={12} sm={4}>
          <Box display='flex' alignItems='center'>
            <Typography variant='h6'>Athletes</Typography>

            {group.memberIds.length
              ? <IconButton
                size='small'
                color='primary'
                onClick={() => setModal({ ...modal, group: true })}
              >
                <AddIcon />
              </IconButton>
              : null
            }
          </Box>

          <TextField
            label='Search athletes by email'
            size="small"
            variant="standard"
            value={search.email}
            onChange={e => setSearch({ email: e.target.value })}
            sx={{ mb: 4 }}
          />

          <Stack direction='row' flexWrap='wrap'>
            {filtered.map(user => <Chip
              key={user.uid}
              label={user.email}
              sx={{ m: 0.5, cursor: 'pointer' }}
              variant={group.memberIds.find(id => id === user.uid) ? 'default' : 'outlined' as any}
              onClick={() => {
                // if user already selected, deselect
                const memberIds = group.memberIds.find(id => id === user.uid)
                  ? group.memberIds.filter(id => id !== user.uid)
                  : [...group.memberIds, user.uid];

                setGroup({ ...group, memberIds });
              }}
            />)}
          </Stack>
        </Grid>
      </Grid>

      {/* Create Group Modal */}
      <MyModal
        isOpen={modal.group}
        setIsOpen={() => setModal({ ...modal, group: false })}
        actions={<>
          <Button onClick={() => createGroup(group)} color="primary">Create</Button>
          <Button onClick={() => setModal(prev => ({ ...prev, group: false }))} color="secondary">Cancel</Button>
        </>}
      >
        <Typography variant='h6' mb={2}>Create Group</Typography>

        <TextField
          label='Set group name'
          variant='standard'
          fullWidth
          value={group.name}
          onChange={e => setGroup({ ...group, name: e.target.value })}
          sx={{mb: 4}}
        />

        <Alert severity='info'>Group will have {group.memberIds.length} members</Alert>
      </MyModal>
    </>
  );
}