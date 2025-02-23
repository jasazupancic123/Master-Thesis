'use client';

import { handleApiRequest } from '@/common/type/state.type';
import EditCycleForm from '@/components/edit-cycle-form';
import FloatingButton from '@/components/floating-button';
import MyModal from '@/components/modal';
import MultiCycleSlider from '@/components/multi-cycle-slider';
import CycleComponents from '@/components/training-year-view/cycle-components';
import { useGroup } from '@/context/group-provider';
import { GroupController } from '@/controller/group/group.controller';
import { Cycle } from '@/controller/group/type/cycle.type';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function TrainerYearView() {
  const router = useRouter();
  const {
    token,
    filter,
    group,
    setGroup,
    cycle,
    setCycle,
    setDetectedChanges,
  } = useGroup();

  const theme = useTheme();
  const [selectedGroup, setSelectedGroup] = useState(group);
  const [showEditCycleModal, setShowEditCycleModal] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);

  function handleDeleteCycle() {
    if (!editCycle || !selectedGroup) return;

    const updatedCycles = [...selectedGroup.cycles].filter(
      (cycle) => cycle.id !== editCycle.id
    );

    if (cycle && editCycle.id === cycle?.id) setCycle(undefined);
    setSelectedGroup({ ...selectedGroup, cycles: updatedCycles });
    setEditCycle(null);
    setDetectedChanges(true);
  }

  async function handleSaveGroup() {
    handleApiRequest(
      router,
      () =>
        GroupController.update(token, group.id, {
          cycles: selectedGroup.cycles,
        }),
      (response) => {
        setGroup(response);
        setSelectedGroup(response);
        setDetectedChanges(false);

        toast.success('Group successfully saved');
      },
      undefined,
      'Failed to save group'
    );
  }

  return (
    <>
      <FloatingButton label="Save group" onClick={handleSaveGroup} />

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        width="100%"
        maxWidth="100%"
        mb={3}
        sx={{ overflowX: 'hidden' }}
      >
        <Box
          width="100%"
          maxWidth="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          minHeight={195}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        >
          <MultiCycleSlider
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
          />
        </Box>

        <Box
          width="100%"
          maxWidth="100%"
          sx={{
            overflowX: 'hidden', // Prevents unexpected expansion
          }}
        >
          <CycleComponents
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            setEditModal={setShowEditCycleModal}
            setEditCycle={setEditCycle}
          />
        </Box>
      </Box>

      {editCycle && (
        <MyModal
          isOpen={showEditCycleModal}
          setIsOpen={(open) => setShowEditCycleModal(open)}
          onCancel={() => setShowEditCycleModal(false)}
          cancelText="Close"
          onConfirm={() => {
            setShowEditCycleModal(false);
            setEditCycle(null);
          }}
        >
          <EditCycleForm
            selectedCycle={editCycle}
            setSelectedCycle={setEditCycle}
            handleDeleteCycle={handleDeleteCycle}
          />
        </MyModal>
      )}
    </>
  );
}
