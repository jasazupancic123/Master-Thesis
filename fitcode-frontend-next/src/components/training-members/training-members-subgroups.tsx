'use client';

import { MoreVert } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { Draggable, Droppable } from 'react-beautiful-dnd';

import type { SetState } from '@/common/type/state.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { UseTrainingMembersReturnType } from './hooks/use-members.hook';
import {
  handleDeleteSubgroup,
  updateSelectedAthleteSubgroup,
} from './actions/actions-subgroups';
import { DEFAULT_SUBGROUP_ID } from '../trainer-group-day-view/constant/subgroups.constant';

interface TrainingMembersSubgroupProps {
  subgroup: Subgroup;
  subgroupIndex: number;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  trainingMembersContext: UseTrainingMembersReturnType;
}

export default function TrainingMembersSubgroup(
  props: TrainingMembersSubgroupProps
) {
  const theme = useTheme();

  const mainConext = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayViewContext();

  const { users } = mainConext;
  const { setTrainings, setDetectedChanges } = groupContext;

  const {
    component,
    setComponent,
    training,
    setTraining,
    setSelectedSubgroup,
    selectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
    selectedExercises,
    setSelectedExercises,
  } = trainerDayViewContext;

  const {
    subgroup,
    subgroupIndex,
    anchorEl,
    setAnchorEl,
    trainingMembersContext,
  } = props;

  const { members } = trainingMembersContext;

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isSubgroupSelected = (id: string): boolean => {
    if (selectedSubgroup?.id === id) return true;
    else if (!selectedSubgroup && id === DEFAULT_SUBGROUP_ID) return true;

    return false;
  };

  if (!training) return null;

  return (
    <Droppable
      key={`droppable-${subgroup.id}`}
      droppableId={subgroup.id}
      direction="horizontal"
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={() => {
            if (
              selectedSubgroup?.id === subgroup.id ||
              (!selectedSubgroup &&
                subgroupIndex === 0 &&
                subgroup.id === DEFAULT_SUBGROUP_ID)
            )
              return;
            if (subgroupIndex > 0) {
              // subgroup
              setSelectedSubgroup(subgroup);
              setSelectedAthlete(undefined);

              setSelectedExercises(
                subgroup.supersets
                  .flatMap((s) => s.exercises)
                  .filter((e) =>
                    selectedExercises.some((se) => se.id === e.id)
                  ) || []
              );
            } else if (subgroupIndex === 0) {
              // main group
              setSelectedSubgroup(null);
              setSelectedAthlete(undefined);

              if (!component) return;

              setSelectedExercises(
                component?.supersets
                  .flatMap((s) => s.exercises)
                  .filter((e) =>
                    selectedExercises.some((se) => se.id === e.id)
                  ) || []
              );
            }
          }}
          style={{
            display: 'inline-block',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {subgroup.id !== DEFAULT_SUBGROUP_ID &&
            selectedSubgroup &&
            subgroup.id === selectedSubgroup.id && (
              <Box position="absolute" right={0} top={0}>
                <IconButton
                  sx={{ p: 0, m: 0, zIndex: 1000 }}
                  onClick={(event) => {
                    event.stopPropagation(); // Prevents clicking affecting parent elements
                    setAnchorEl(event.currentTarget);
                  }}
                >
                  <MoreVert sx={{ fontSize: 20 }} />
                </IconButton>

                {/* Context Menu */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem
                    onClick={() => {
                      if (!component || !selectedSubgroup) return;
                      handleDeleteSubgroup(
                        {
                          subgroupId: selectedSubgroup.id,
                        },
                        {
                          useGroup: groupContext,
                          useTrainerDayViewContext: {
                            ...trainerDayViewContext,
                            training,
                            component,
                          },
                        }
                      );
                      handleMenuClose();
                    }}
                    sx={{ color: theme.palette.error.main }}
                  >
                    Remove
                  </MenuItem>
                </Menu>
              </Box>
            )}
          <Box
            display="flex"
            flexDirection={'column'}
            alignItems="center"
            sx={{
              marginRight:
                subgroup.id !== DEFAULT_SUBGROUP_ID &&
                selectedSubgroup &&
                selectedSubgroup.id === subgroup.id
                  ? '20px'
                  : undefined,
            }}
          >
            <Card
              key={`card-${subgroup.id}`}
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
              {subgroup.membersIds.map((memberId, index) => {
                const member = members.find((user) => user.uid === memberId);

                if (!member) return null;

                return (
                  <Draggable
                    key={`${member.uid}-${index}`}
                    draggableId={`${member.uid}`}
                    index={index}
                  >
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        key={`${subgroup.id}-${member.uid}-tooltip`}
                        sx={{ p: 0, m: 0 }}
                        onClick={() => {
                          if (!component) {
                            console.log('returning');
                            return;
                          }

                          console.log('before updateSelectedAthleteSubgroup');
                          updateSelectedAthleteSubgroup(
                            {
                              member,
                              subgroupId: subgroup.id,
                            },
                            {
                              useTrainerDayViewContext: {
                                ...trainerDayViewContext,
                                training,
                                component,
                              },
                            }
                          );
                        }}
                        borderRadius={selectedAthlete === member ? '50%' : 0}
                        border={
                          selectedAthlete === member
                            ? `2px solid ${theme.palette.primary.main}`
                            : 'none'
                        }
                        zIndex={1000}
                      >
                        <Tooltip
                          title={member.email}
                          sx={{ mx: 1, my: '0px !important', p: 0 }}
                        >
                          <Avatar
                            className="avatar-border"
                            src={
                              users.find((m) => m.uid === member.uid)
                                ?.photoURL || '/user_avatar.png'
                            }
                            sx={{
                              width: 50,
                              height: 50,
                              m: selectedAthlete === member ? 0.25 : 0.5,
                              filter: 'grayscale(100%)',
                            }}
                          >
                            {/* {member.email[0].toUpperCase()} */}
                          </Avatar>
                        </Tooltip>
                      </Box>
                    )}
                  </Draggable>
                );
              })}
            </Card>
            <Typography
              fontSize={12}
              fontWeight={600}
              sx={{
                textAlign: 'center',
                color: isSubgroupSelected(subgroup.id)
                  ? theme.palette.primary.main
                  : undefined,
              }}
            >
              {`G${subgroupIndex + 1}#${subgroup.membersIds.length}`}
            </Typography>
          </Box>
        </div>
      )}
    </Droppable>
  );
}
