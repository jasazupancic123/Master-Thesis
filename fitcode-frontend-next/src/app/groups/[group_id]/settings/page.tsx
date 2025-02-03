'use client';

import { useState } from 'react';
import { useGroupSidebar } from '@/context/groups-sidebar-provider';
import { Box, Typography, TextField, Button } from '@mui/material';
import toast from 'react-hot-toast';
import { GroupController } from '@/group/group.controller';
import { useAppContext } from '@/context/app-provider';
import { useRouter } from 'next/navigation';
import { LINK_GROUPS } from '@/common/constant/navigation.constant';
import PageTitle from '../../components/page-title';

export default function GroupSettings() {
  const { selected, setSelected } = useGroupSidebar();
  const { token } = useAppContext();
  const [groupName, setGroupName] = useState(selected.group?.name || '');
  const router = useRouter();

  const handleUpdateGroup = async () => {
    if (groupName.length < 3) {
      toast.error('Group name must be at least 3 characters long.');
      return;
    }
    if (groupName === selected.group?.name) {
      toast.error('No changes detected.');
      return;
    }
    try {
      const updatedGroup = await GroupController.updateGroup(
        token,
        selected.group?.id || '',
        {
          name: groupName,
        }
      );
      setSelected({ ...selected, group: updatedGroup });
      toast.success('Group updated successfully.');
      router.push(LINK_GROUPS.href + '/' + updatedGroup.id);
    } catch (error) {
      toast.error('Failed to update group.');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      //TODO: await GroupController.deleteGroup(token, selected.group?.id || '');
      toast.success('Group deleted successfully.');
      router.push(LINK_GROUPS.href);
    } catch (error) {
      toast.error('Failed to delete group.');
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      height="100%"
    >
      <PageTitle title="Group Settings" />
      <TextField
        label="Group Name"
        value={groupName}
        sx={{ minWidth: 275, mt: 3 }}
        onChange={(e) => {
          setGroupName(e.target.value);
        }}
      />
      <Typography variant="h6" gutterBottom mt={3}>
        *HERE ADD TRAINER LIST IF THERE CAN BE MULTIPLE TRAINERS IN A GROUP*
      </Typography>

      <Button
        variant="contained"
        color="error"
        sx={{ mt: 2 }}
        onClick={() => handleDeleteGroup()}
      >
        Delete Group *not working yet*
      </Button>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={() => handleUpdateGroup()}
      >
        Update Group
      </Button>
    </Box>
  );
}
