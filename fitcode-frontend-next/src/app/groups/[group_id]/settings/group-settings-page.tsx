'use client';

import GroupSidebar from '@/components/group-sidebar';
import PageTitle from '@/components/page-title';
import { useGroup } from '@/context/group-provider';
import { Box, Button, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { handleDeleteGroup, handleUpdateGroup } from './state';

export default function GroupSettingsPage() {
  const { token, group, setGroup, groups } = useGroup();
  const router = useRouter();

  return (
    <>
      <Box mt="16px">
        <GroupSidebar groups={groups} group={group} />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        height="100%"
        bgcolor="background.paper"
        borderRadius={5}
        pb={2}
      >
        <PageTitle title="Group Settings" />

        <TextField
          label="Group Name"
          value={group.name}
          sx={{ minWidth: 275, mt: 3 }}
          onChange={(e) =>
            setGroup((prev) => ({ ...prev, name: e.target.value }))
          }
        />

        <Button
          variant="contained"
          color="error"
          sx={{ mt: 2 }}
          onClick={() =>
            handleDeleteGroup(token, { groupId: group.id }, { router })
          }
        >
          Delete Group
        </Button>

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => handleUpdateGroup(token, group, { router, setGroup })}
        >
          Update Group
        </Button>
      </Box>
    </>
  );
}
