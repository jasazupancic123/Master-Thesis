'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Avatar, Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';

import { DEFAULT_SUBGROUP_ID } from '../trainer-group-day-view/constant/subgroups.constant';
import { handleOnDragEnd } from './actions/actions-dnd';
import { updateSelectedAthleteSubgroup } from './actions/actions-subgroups';
import useTrainingMembers from './hooks/use-members.hook';
import useTrainingMembersSubgroups from './hooks/use-subgroups.hook';
import TrainingMembersSubgroup from './training-members-subgroup';
import type { User } from '@/core/user/type/user.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { Add } from '@mui/icons-material';
import AddMemberModal from '../trainer-group-header/add-member-modal';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const { isSticky } = props;
  const theme = useTheme();

  const mainContext = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();
  const trainingMembersContext = useTrainingMembers();
  const trainingMembersSubgroupsContext = useTrainingMembersSubgroups(
    trainingMembersContext
  );

  const { users } = mainContext;
  const { training, component, selectedAthlete } = trainerDayViewContext;

  const { members, sortedMembers, item } = trainingMembersContext;
  const { subgroups } = trainingMembersSubgroupsContext;

  const [activeMember, setActiveMember] = useState<User | null>(null);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  if (selectedAthlete) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(e) => {
        const user = users.data.find((m) => m.uid === e.active.id);
        if (user) setActiveMember(user);
      }}
      onDragEnd={(e: DragEndEvent) => {
        handleOnDragEnd(e, {
          useMain: mainContext,
          useGroup: groupContext,
          useTrainerDayViewContext: trainerDayViewContext,
          useTrainingMembersSubgroups: trainingMembersSubgroupsContext,
          useTrainingMembers: trainingMembersContext,
        });

        setActiveMember(null);
      }}
    >
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
            border: isSticky ? '1px solid grey' : undefined,
            overflow: 'visible',
          }}
        >
          <Box>
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
                flexDirection="column"
                alignItems="center"
                gap={1}
              >
                <Box
                  display="flex"
                  flexWrap="wrap"
                  justifyContent="center"
                  alignItems="center"
                  gap={1}
                >
                  {item.membersIds.map((memberId) => {
                    const member = members.find(
                      (user) => user.uid === memberId
                    );

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
                            updateSelectedAthleteSubgroup(
                              member,
                              DEFAULT_SUBGROUP_ID,
                              trainerDayViewContext
                            );

                            console.log(member.displayName, member.uid);
                          }}
                          zIndex={1000}
                        >
                          <Avatar
                            className="avatar-border"
                            src={
                              users.data.find((m) => m.uid === member.uid)
                                ?.photoURL || USER_AVATAR_IMG_URL
                            }
                            sx={{
                              width: 50,
                              height: 50,
                              cursor: 'pointer',
                              filter: 'grayscale(100%)',
                            }}
                          />
                        </Box>
                      </Tooltip>
                    );
                  })}
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    onClick={() => setAddMemberModal(true)}
                    sx={{
                      width: 50,
                      height: 50,
                      cursor: 'pointer',
                      borderRadius: '50%',
                      border: `1px solid ${theme.palette.primary.main}`,
                      backgroundColor: theme.palette.background.dark,
                    }}
                  >
                    <Add sx={{ color: theme.palette.primary.main }} />
                  </Box>
                </Box>

                <Typography
                  fontSize={12}
                  fontWeight={600}
                  sx={{
                    textAlign: 'center',
                    color: theme.palette.primary.main,
                  }}
                >
                  {`G#${item.membersIds.length}`}
                </Typography>
              </Box>
            )}
            <Box display="flex" gap={4}>
              {training &&
                subgroups
                  .filter((sg) => !sg.parentId) // display only top-level subgroups
                  .map((subgroup, subgroupIndex) => {
                    // Assign border color based on the subgroup index
                    return (
                      <TrainingMembersSubgroup
                        key={subgroup.id}
                        subgroup={subgroup}
                        subgroupIndex={subgroupIndex}
                        anchorEl={anchorEl}
                        setAnchorEl={setAnchorEl}
                        trainingMembersContext={trainingMembersContext}
                        activeMember={activeMember}
                      />
                    );
                  })}
            </Box>
          </Box>
        </Stack>
      </Stack>
      <DragOverlay>
        {activeMember ? (
          <Avatar
            src={activeMember.photoURL || USER_AVATAR_IMG_URL}
            sx={{
              width: 50,
              height: 50,
              filter: 'grayscale(100%)',
            }}
          />
        ) : null}
      </DragOverlay>
      <AddMemberModal open={addMemberModal} setOpen={setAddMemberModal} />
    </DndContext>
  );
}
