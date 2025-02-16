'use client';

import MyModal from '@/components/modal';
import { useGroup } from '@/context/group-provider';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AddCycleForm from '../../../../components/add-cycle-form';
import GroupSidebar from '../../../../components/group-sidebar';
import PageTitle from '../../../../components/page-title';
import { handleDeleteGroup, handleUpdateGroup } from './state';

export default function GroupSettingsPage() {
  const { token, group, setGroup, groups } = useGroup();

  const router = useRouter();
  const [showCycleModal, setShowCyclesModal] = useState(false);

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
          onClick={() => handleUpdateGroup(token, group, { setGroup })}
        >
          Update Group
        </Button>
      </Box>

      <MyModal
        isOpen={showCycleModal}
        setIsOpen={(open) => setShowCyclesModal(open)}
        onCancel={() => setShowCyclesModal(false)}
        cancelText="Close"
      >
        <AddCycleForm
          token={token}
          group={group}
          setGroup={setGroup}
          onClose={() => setShowCyclesModal(false)}
        />
      </MyModal>
    </>
  );
}
