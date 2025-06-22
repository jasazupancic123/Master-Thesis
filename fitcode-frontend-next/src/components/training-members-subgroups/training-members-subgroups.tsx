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
  const { setTodaysTrainings, setSelectedExercises } =
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
    showAthleteReport,
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
            minWidth: 95,
            display: 'inline-block',
            border:
              (selectedSubgroup &&
                subgroup.id === selectedSubgroup.subgroup?.id) ||
              (!selectedSubgroup?.subgroup &&
                subgroups.length > 1 &&
                subgroup.id === 'default')
                ? `3.5px solid ${borderColor}`
                : `2px solid ${borderColor}`,
            borderTopLeftRadius: 7,
            borderTopRightRadius: 7,
            backgroundColor: theme.palette.background.light,
            cursor: 'pointer',
            position: 'relative',
            margin: '5px',
          }}
        >
          {subgroup.id !== 'default' &&
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
                          setTodaysTrainings,
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
            sx={{
              backgroundColor: theme.palette.background.light,
              borderRadius: 10,
              marginRight:
                subgroup.id !== 'default' &&
                selectedSubgroup?.subgroup &&
                selectedSubgroup.subgroup.id === subgroup.id
                  ? '20px'
                  : undefined,
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              sx={{
                pr: 1.5,
                backgroundColor: theme.palette.background.light,
                borderTopLeftRadius: 10,
              }}
              height={screenSize.isMobile ? 50 : 60}
            >
              {/* First Typography (Green Box) */}
              <Box
                height={20}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  textAlign: 'center',
                  display: 'flex', // Center content inside
                  flex: 1, // Fill remaining space
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTopLeftRadius: 5,
                }}
                width={20}
              >
                <Typography
                  variant="caption"
                  sx={{ textAlign: 'center', color: 'white' }}
                >
                  {`G${subgroupIndex + 1}`}
                </Typography>
              </Box>

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
                  variant="caption"
                  color="textSecondary"
                  sx={{ textAlign: 'center' }}
                >
                  {subgroup.membersIds.length}
                </Typography>
              </Box>
            </Box>
            <Card
              key={`card-${subgroup.id}`}
              sx={{
                pr: 0.5,
                py: 0,
                pl: 0,
                borderRadius: 2,
                backgroundColor: theme.palette.background.light,
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
                      <Tooltip
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        key={`${subgroup.id}-${member.uid}-tooltip`}
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
                              width: screenSize.isMobile ? 40 : 50,
                              height: screenSize.isMobile ? 40 : 50,
                              m: selectedAthlete === member ? 0.25 : 0.5,
                            }}
                          >
                            {/* {member.email[0].toUpperCase()} */}
                          </Avatar>
                        </Box>
                      </Tooltip>
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
