'use client';

import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { User } from '@/controller/user/type/user.type';
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
import { handleDeleteSubgroup } from '../trainer-day-view/state';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { MoreVert } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { SetState } from '@/common/type/state.type';
import {
  DEFAULT_SUBGROUP,
  DEFAULT_SUBGROUP_ID,
} from '../trainer-day-view/constant';

interface TrainingMembersSubgroupProps {
  subgroup: Subgroup;
  subgroups: Subgroup[];
  subgroupIndex: number;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  members: User[];
  borderColor: string;
  setEditSubgroupName: SetState<string>;
  setEditedSubgroup: SetState<Subgroup | null>;
  setModal: SetState<{ editSubgroup: boolean }>;
}

export default function TrainingMembersSubgroup(
  props: TrainingMembersSubgroupProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { setDetectedChanges } = useGroup();
  const { setSelectedExercises } = useTrainerDayViewContext();

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
    setShowAthleteReport,
  } = useTrainerDayViewContext();

  const {
    subgroup,
    subgroups,
    subgroupIndex,
    anchorEl,
    setAnchorEl,
    members,
    borderColor,
    setEditSubgroupName,
    setEditedSubgroup,
    setModal,
  } = props;

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isSubgroupSelected = (id: string): boolean => {
    if (selectedSubgroup?.subgroup?.id === id) return true;
    else if (!selectedSubgroup && id === DEFAULT_SUBGROUP([], []).id)
      return true;

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
          onClick={(event) => {
            if (subgroupIndex > 0) {
              setSelectedSubgroup({
                subgroup: subgroup || null,
                index: subgroupIndex - 1,
              });

              const exercisesIds = subgroup.supersets.flatMap((s) =>
                s.exercises.map((e) => e.id)
              );
              setSelectedExercises((prev) =>
                prev.filter((ex) => exercisesIds.includes(ex.id))
              );
            } else if (subgroupIndex === 0) {
              setSelectedSubgroup(null);

              if (!component) return;

              const exercisesIds = component.supersets.flatMap((s) =>
                s.exercises.map((e) => e.id)
              );
              setSelectedExercises((prev) =>
                prev.filter((ex) => exercisesIds.includes(ex.id))
              );
            }
          }}
          style={{
            display: 'inline-block',
            border:
              (selectedSubgroup &&
                subgroup.id === selectedSubgroup.subgroup?.id) ||
              (!selectedSubgroup && subgroup.id === DEFAULT_SUBGROUP([], []).id)
                ? `1.5px solid ${theme.palette.background.lightBorder}`
                : undefined,
            borderRadius: '5px',
            backgroundColor: theme.palette.background.dark,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {subgroup.id !== DEFAULT_SUBGROUP_ID &&
            selectedSubgroup?.subgroup &&
            subgroup.id === selectedSubgroup?.subgroup.id && (
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
                  {/* Edit Name Option */}
                  <MenuItem
                    onClick={() => {
                      if (!selectedSubgroup?.subgroup) return;
                      setModal({ editSubgroup: true });
                      setEditSubgroupName(selectedSubgroup.subgroup.name);
                      setEditedSubgroup(subgroup);
                      handleMenuClose();
                    }}
                  >
                    Edit Name
                  </MenuItem>

                  {/* Delete Option */}
                  <MenuItem
                    onClick={() => {
                      if (!component || !selectedSubgroup?.subgroup) return;
                      handleDeleteSubgroup(
                        {
                          subgroupId: selectedSubgroup?.subgroup.id,
                        },
                        {
                          training,
                          setTraining,
                          component,
                          setComponent,
                          setDetectedChanges,
                        }
                      );
                      handleMenuClose();
                    }}
                    sx={{ color: 'red' }}
                  >
                    Delete
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
                selectedSubgroup?.subgroup &&
                selectedSubgroup.subgroup.id === subgroup.id
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
                    {(provided, snapshot) => (
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
                              width: 40,
                              height: 40,
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
