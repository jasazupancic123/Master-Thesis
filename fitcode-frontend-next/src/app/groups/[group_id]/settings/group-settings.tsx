'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import PageTitle from '../../../../components/page-title';
import AddCycleModal from '../../../../components/add-cycle-modal';
import MyModal from '@/components/modal';
import { GroupIdPageProps } from '../type';
import TrainerGroupSidebar from '../../../../components/trainer-group-sidebar';
import { handleDeleteGroup, handleUpdateGroup } from './state';

export default function GroupSettings(props: GroupIdPageProps) {
  const { token, group, users, groups, exercises, attributes, components } =
    props;

  const router = useRouter();
  const [showCycleModal, setShowCyclesModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(() => group);

  return (
    <>
      <Box mt="16px">
        <TrainerGroupSidebar
          groups={groups}
          selectedGroup={selectedGroup}
          logout={async () => {
            console.log('Log out');
          }}
        />
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
          value={selectedGroup.name}
          sx={{ minWidth: 275, mt: 3 }}
          onChange={(e) =>
            setSelectedGroup({ ...selectedGroup, name: e.target.value })
          }
        />

        <Typography variant="h6" gutterBottom mt={3}>
          *HERE ADD TRAINER LIST IF THERE CAN BE MULTIPLE TRAINERS IN A GROUP*
        </Typography>

        {showCycleModal && (
          <MyModal
            isOpen={showCycleModal}
            setIsOpen={(open) => setShowCyclesModal(open)}
            onCancel={() => setShowCyclesModal(false)}
            cancelText="Close"
          >
            <AddCycleModal
              token={token}
              onClose={() => setShowCyclesModal(false)}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
            />
          </MyModal>
        )}

        <Button
          variant="contained"
          color="error"
          sx={{ mt: 2 }}
          onClick={() => handleDeleteGroup(selectedGroup.id, router)}
        >
          Delete Group *not working yet*
        </Button>

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() =>
            handleUpdateGroup(token, selectedGroup, setSelectedGroup)
          }
        >
          Update Group
        </Button>
      </Box>
    </>
  );
}
