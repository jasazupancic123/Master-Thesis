'use client';

import { COLORS } from '@/common/constant/color.constant';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { User } from '@/controller/user/type/user.type';
import {
  Avatar,
  Box,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_SUBGROUP } from '../trainer-day-view/constant';
import { onDragEndSubgroup } from '../trainer-day-view/state';
import SelectedMemberReport from '../selected-member-report/selected-member-report';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import MyModal from '../modal/modal';
import { useTheme } from '@mui/material';
import { handleAddMembersSubgroup } from './state';
import TrainingMembersSubgroup from '../training-members-subgroups/training-members-subgroups';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const { isSticky } = props;
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { group, users, setDetectedChanges } = useGroup();

  const {
    members: groupMembers,
    component,
    setComponent,
    training,
    setTraining,
    setTodaysTrainings,
    setSelectedSubgroup,
    selectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
    showAthleteReport,
    setShowAthleteReport,
  } = useTrainerDayViewContext();

  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [changedSubgroupIds, setChangedSubgroupIds] = useState<string[]>([]);

  const members = users.filter((user) => group.membersIds.includes(user.uid));
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [modal, setModal] = useState({ editSubgroup: false });
  const [editSubgroupName, setEditSubgroupName] = useState<string>('');
  const [editedSubgroup, setEditedSubgroup] = useState<Subgroup | null>(null);

  // Sort members:
  // 1. Members without a subgroup come first
  // 2. Members in the same subgroup stay together
  const sortedMembers = [...members].sort((a, b) => {
    if (!training) return 0; // If no training data, return original order

    const getSubgroupIndex = (uid: string) =>
      training.components
        .flatMap((c) => c.subgroups)
        .findIndex((s) => s.membersIds.includes(uid));

    const subgroupIndexA = getSubgroupIndex(a.uid);
    const subgroupIndexB = getSubgroupIndex(b.uid);

    // Place users without a subgroup first
    if (subgroupIndexA === -1 && subgroupIndexB !== -1) return -1;
    if (subgroupIndexA !== -1 && subgroupIndexB === -1) return 1;

    // If both have a subgroup, sort by subgroup index
    return subgroupIndexA - subgroupIndexB;
  });

  useEffect(() => {
    if (!training) return;

    if (!component) {
      setSubgroups([]);
      return;
    }

    const subgroups = component?.subgroups || [];
    const availableMembers = members.filter(
      (member) =>
        !subgroups.some((subgroup: any) =>
          subgroup.membersIds.includes(member.uid)
        )
    );

    setSubgroups([
      DEFAULT_SUBGROUP(availableMembers, training.futureStats),
      ...subgroups,
    ]);
  }, [training, component]);

  useEffect(() => {
    if (!selectedAthlete) setShowAthleteReport(false);
  }, [selectedAthlete]);

  const handleOnDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) {
      const user = members.find((m) => m.uid === draggableId);
      if (!user) return;
      await handleAddMembersSubgroup(
        { member: user },
        {
          training,
          setTraining,
          setTodaysTrainings,
          component,
          setComponent,
          setDetectedChanges,
        }
      );
    } else {
      onDragEndSubgroup(result, {
        subgroups,
        setSubgroups,
        changedSubgroupIds,
        setChangedSubgroupIds,
        availableMembers,
        setAvailableMembers,
        users,
        component,
        training,
        setTraining,
        setTodaysTrainings,
      });
    }
  };

  return selectedAthlete && showAthleteReport ? (
    <SelectedMemberReport groupMembers={groupMembers} />
  ) : (
    <Stack
      direction="row"
      px={2}
      justifyContent={isSticky ? 'center' : undefined}
    >
      {isSticky && (
        <div style={{ height: 116, width: '100%' }} /> // Mock Stack to maintain layout
      )}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-start"
        alignItems="center"
        sx={{
          width: !isSticky ? '100%' : undefined,
          maxWidth: 1500,
          borderRadius: 2,
          rowGap: 1,
          py: isSticky ? 1 : !component ? 1 : 2,
          display: 'flex',
          flexWrap: 'wrap',
          margin: 'auto',
          justifyContent: 'center',
          mt: !component ? 2 : 0,
          minHeight:
            group.membersIds &&
            group.membersIds.length > 0 &&
            !isSticky &&
            component
              ? 80
              : group.membersIds &&
                  group.membersIds.length > 0 &&
                  !isSticky &&
                  component
                ? 60
                : undefined,
          backgroundColor: !component
            ? theme.palette.background.light
            : 'background.paper',
          zIndex: isSticky ? 10 : undefined,
          position: isSticky ? 'fixed' : 'relative',
          top: isSticky ? '70px' : undefined,
          px: !component ? 1 : 0,
          boxShadow: isSticky ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
          border: isSticky ? '1px solid grey' : 'none',
        }}
      >
        <DragDropContext onDragEnd={(result) => handleOnDragEnd(result)}>
          {/* No members to display*/}
          {!training && sortedMembers.length === 0 && (
            <Typography variant="caption" color="textSecondary">
              No available members
            </Typography>
          )}

          {/* Training/component is not selected yet, display the members normally */}
          {!component &&
            sortedMembers.length > 0 &&
            sortedMembers.map((member) => {
              return (
                <Tooltip
                  key={member.uid + 'tooltip1'}
                  title={member.email}
                  sx={{ mx: 1, py: 0 }}
                >
                  <Box
                    sx={{ p: 0, my: 1, cursor: 'pointer' }}
                    onClick={() => setSelectedAthlete(member)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedAthlete(member);
                      setShowAthleteReport(true);
                    }}
                    borderRadius={selectedAthlete === member ? '50%' : 0}
                    border={
                      selectedAthlete === member
                        ? `2px solid ${theme.palette.primary.main}`
                        : 'none'
                    }
                  >
                    <Avatar
                      className="avatar-border"
                      src={
                        groupMembers.find((m) => m.id === member.uid)
                          ?.profileImageUrl || '/user_avatar.png'
                      }
                      sx={{
                        width: screenSize.isMobile ? 40 : 50,
                        height: screenSize.isMobile ? 40 : 50,
                        mx: 0,
                        py: 0,
                      }}
                    >
                      {/* {member.email[0].toUpperCase()} */}
                    </Avatar>
                  </Box>
                </Tooltip>
              );
            })}

          {training &&
            subgroups.map((subgroup, subgroupIndex) => {
              // Assign border color based on the subgroup index
              const borderColor = subgroup.color
                ? subgroup.color
                : COLORS[(subgroupIndex % COLORS.length) - 1];

              return (
                <TrainingMembersSubgroup
                  key={subgroup.id}
                  subgroup={subgroup}
                  subgroups={subgroups}
                  subgroupIndex={subgroupIndex}
                  anchorEl={anchorEl}
                  setAnchorEl={setAnchorEl}
                  members={sortedMembers}
                  borderColor={borderColor}
                  setEditSubgroupName={setEditSubgroupName}
                  setEditedSubgroup={setEditedSubgroup}
                  setModal={setModal}
                />
              );
            })}
        </DragDropContext>
      </Stack>
      <MyModal
        isOpen={modal.editSubgroup}
        setIsOpen={(editSubgroup) =>
          setModal((prev) => ({ ...prev, editSubgroup }))
        }
        title="Edit Subgroup"
        onCancel={() => {
          setEditedSubgroup(null);
          setModal((prev) => ({ ...prev, editSubgroup: false }));
          setEditSubgroupName('');
        }}
        onConfirm={() => {
          if (!editSubgroupName.length)
            return toast.error('Name cannot be empty');
          if (!editedSubgroup || !component || !training) return;

          const updatedSubgroup = {
            ...editedSubgroup,
            name: editSubgroupName,
          };

          const updatedSubgroups = [...component.subgroups].map((subgroup) =>
            subgroup.id === updatedSubgroup.id ? updatedSubgroup : subgroup
          );

          const newComponent = { ...component!, subgroups: updatedSubgroups };
          const newTraining = {
            ...training,
            components: training.components.map((c) =>
              c.id === newComponent.id ? newComponent : c
            ),
          };

          if (
            selectedSubgroup?.subgroup &&
            updatedSubgroup.id === selectedSubgroup?.subgroup.id
          )
            setSelectedSubgroup((prev: any) => ({
              ...prev,
              subgroup: updatedSubgroup,
            }));
          setSubgroups(updatedSubgroups);
          setComponent(newComponent);
          setTraining(newTraining);

          setModal((prev) => ({ ...prev, editSubgroup: false }));
          setEditSubgroupName('');
          setDetectedChanges(true);
        }}
      >
        <Stack spacing={4} p={1}>
          {/* Name */}
          <TextField
            label="Name"
            fullWidth
            value={editSubgroupName}
            variant="outlined"
            size="small"
            onChange={(e) => setEditSubgroupName(e.target.value)}
          />
        </Stack>
      </MyModal>
    </Stack>
  );
}
