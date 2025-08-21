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

import {
  DEFAULT_SUBGROUP,
  DEFAULT_SUBGROUP_ID,
} from '../trainer-day-view/constant';
import { handleDeleteSubgroup } from '../trainer-day-view/state';
import type { SetState } from '@/common/type/state.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { User } from '@/controller/user/type/user.type';
import { useGroup } from '@/store/group-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface TrainingMembersSubgroupProps {
  subgroup: Subgroup;
  subgroupIndex: number;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  members: User[];
  setEditSubgroupName: SetState<string>;
  setEditedSubgroup: SetState<Subgroup | null>;
  setModal: SetState<{ editSubgroup: boolean }>;
}

export default function TrainingMembersSubgroup(
  props: TrainingMembersSubgroupProps
) {
  const theme = useTheme();

  const { setTrainings, setDetectedChanges } = useGroup();
  const { selectedExercises, setSelectedExercises } =
    useTrainerDayViewContext();

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
  } = useTrainerDayViewContext();

  const {
    subgroup,
    subgroupIndex,
    anchorEl,
    setAnchorEl,
    members,
    setEditSubgroupName,
    setEditedSubgroup,
    setModal,
  } = props;

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isSubgroupSelected = (id: string): boolean => {
    if (selectedSubgroup?.id === id) return true;
    else if (!selectedSubgroup && id === DEFAULT_SUBGROUP([]).id) return true;

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
                subgroup.id === DEFAULT_SUBGROUP([]).id)
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
            border:
              (selectedSubgroup && subgroup.id === selectedSubgroup.id) ||
              (!selectedSubgroup && subgroup.id === DEFAULT_SUBGROUP([]).id)
                ? `1.5px solid ${theme.palette.background.lightBorder}`
                : undefined,
            borderRadius: '5px',
            backgroundColor: theme.palette.background.dark,
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
                          training,
                          setTraining,
                          component,
                          setComponent,
                          selectedExercises,
                          setSelectedExercises,
                          setTrainings,
                          setSelectedSubgroup,
                          setDetectedChanges,
                        }
                      );
                      handleMenuClose();
                    }}
                    sx={{ color: theme.palette.error.main }}
                  >
                    Remove
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      if (!selectedSubgroup) return;
                      setModal({ editSubgroup: true });
                      setEditSubgroupName(selectedSubgroup.name);
                      setEditedSubgroup(subgroup);
                      handleMenuClose();
                    }}
                  >
                    Edit Name
                  </MenuItem>
                </Menu>
              </Box>
            )}
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.dark,
              borderRadius: 10,
              marginRight:
                subgroup.id !== DEFAULT_SUBGROUP_ID &&
                selectedSubgroup &&
                selectedSubgroup.id === subgroup.id
                  ? '20px'
                  : undefined,
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
                  {`G${subgroupIndex + 1}`}
                </Typography>
              </Box>

              {isSubgroupSelected(subgroup.id) && (
                <Box
                  sx={{
                    height: 16,
                    width: 4,
                    borderRadius: 5,
                    backgroundColor: theme.palette.primary.main,
                  }}
                ></Box>
              )}

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
                  {subgroup.membersIds.length}
                </Typography>
              </Box>
            </Box>
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
                          if (selectedAthlete === member) {
                            setSelectedAthlete(undefined);
                            return;
                          }

                          setSelectedAthlete(member);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedAthlete(member);
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
                        </Tooltip>
                      </Box>
                    )}
                  </Draggable>
                );
              })}
            </Card>
          </Box>
        </div>
      )}
    </Droppable>
  );
}
