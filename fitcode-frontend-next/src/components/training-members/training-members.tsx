'use client';

import {
  Avatar,
  Box,
  Card,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { DragDropContext } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

import MyModal from '../modal/modal';
import SelectedMemberReport from '../selected-member-report/selected-member-report';
import { DEFAULT_SUBGROUP } from '../trainer-day-view/constant';
import { onDragEndSubgroup } from '../trainer-day-view/state';
import TrainingMembersSubgroup from '../training-members-subgroups/training-members-subgroups';
import { handleAddMembersSubgroup } from './state';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { User } from '@/controller/user/type/user.type';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const { isSticky } = props;
  const theme = useTheme();

  const { users } = useMain();
  const { group, setDetectedChanges } = useGroup();

  const {
    members: groupMembers,
    component,
    setComponent,
    training,
    setTraining,
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
        !subgroups.some((subgroup: Subgroup) =>
          subgroup.membersIds.includes(member.uid)
        )
    );

    setSubgroups([
      DEFAULT_SUBGROUP(availableMembers, training.prescribedStats),
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
          component,
          setComponent,
          setSelectedSubgroup,
          setSelectedAthlete,
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
          borderRadius: '5px',
          rowGap: 1,
          display: 'flex',
          flexWrap: 'wrap',
          margin: 'auto',
          justifyContent: 'center',
          zIndex: isSticky ? 10 : undefined,
          position: isSticky ? 'fixed' : 'relative',
          top: isSticky ? '70px' : undefined,
          boxShadow: isSticky ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
          border: isSticky
            ? '1px solid grey'
            : !component
              ? '1px solid grey'
              : undefined,
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
          {!component && (
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center"
              sx={{
                backgroundColor: theme.palette.background.dark,
                borderRadius: 2,
              }}
            >
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{
                  backgroundColor: theme.palette.background.dark,
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                  px: 0.5,
                }}
                gap={0.2}
              >
                {/* First Typography (Green Box) */}
                <Box
                  width={20}
                  height={20}
                  sx={{
                    textAlign: 'center',
                    display: 'flex', // Center content inside
                    flex: 1, // Fill remaining space
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopLeftRadius: 5,
                    borderBottomLeftRadius: 5,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontSize="10px"
                    sx={{ textAlign: 'center', color: 'white' }}
                  >
                    G
                  </Typography>
                </Box>

                {/*sx={{
                backgroundColor: theme.palette.primary.main,
                width: 5,
                height: 20,
                borderRadius: 5,
              }}*/}

                <Box
                  sx={{
                    height: 16,
                    width: 4,
                    borderRadius: 5,
                    backgroundColor: theme.palette.primary.main,
                  }}
                ></Box>

                {/* Second Typography (Member Count) */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center', // Centers text
                    flex: 1, // Fill remaining space
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    fontSize="10px"
                    variant="caption"
                    sx={{ textAlign: 'center' }}
                  >
                    {group.membersIds.length}
                  </Typography>
                </Box>
              </Box>
              <Card
                sx={{
                  m: 0.1,
                  ml: 0,
                  backgroundColor: theme.palette.background.default,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                {group.membersIds.map((memberId) => {
                  const member = members.find((user) => user.uid === memberId);

                  if (!member) return null;

                  return (
                    <Tooltip
                      key={`${member.uid}-tooltip`}
                      title={member.email}
                      sx={{ mx: 1, p: 0 }}
                    >
                      <Box
                        sx={{ p: 0, m: 0 }}
                        onClick={() => {
                          if (selectedAthlete === member) {
                            setSelectedAthlete(undefined);
                            return;
                          }

                          setSelectedAthlete(member);
                        }}
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
                        zIndex={1000}
                      >
                        <Avatar
                          className="avatar-border"
                          src={
                            groupMembers.find((m) => m.id === member.uid)
                              ?.profileImageUrl || '/user_avatar.png'
                          }
                          sx={{
                            width: 50,
                            height: 50,
                            m: selectedAthlete === member ? 0.25 : 0.5,
                          }}
                        >
                          {/* {member.email[0].toUpperCase()} */}
                        </Avatar>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Card>
            </Box>
          )}

          {training &&
            subgroups.map((subgroup, subgroupIndex) => {
              // Assign border color based on the subgroup index
              return (
                <TrainingMembersSubgroup
                  key={subgroup.id}
                  subgroup={subgroup}
                  subgroupIndex={subgroupIndex}
                  anchorEl={anchorEl}
                  setAnchorEl={setAnchorEl}
                  members={sortedMembers}
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

          if (selectedSubgroup && updatedSubgroup.id === selectedSubgroup.id)
            setSelectedSubgroup((prev) => {
              if (!prev) return prev;

              return {
                ...prev,
                subgroup: updatedSubgroup,
              };
            });
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
