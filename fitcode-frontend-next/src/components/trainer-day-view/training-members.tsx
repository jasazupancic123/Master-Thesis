'use client';

import { COLORS } from '@/common/constant/color.constant';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { User } from '@/controller/user/type/user.type';
import {
  Avatar,
  Box,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_SUBGROUP } from './constant';
import {
  handleAddSubgroup,
  handleDeleteSubgroup,
  onDragEndSubgroup,
} from './state';
import SelectedMemberReport from './selected-member-report';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import { MoreVert } from '@mui/icons-material';
import MyModal from '../modal';
import { useTheme } from '@mui/material';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const { isSticky } = props;
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    group,
    users,
    filteredTrainings,
    setFilteredTrainings,
    setDetectedChanges,
    setTrainings,
  } = useGroup();

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevents click event propagation
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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

  async function handleAddMembersSubgroup(member: User) {
    if (!training || !component) return;

    const createSubgroup = {
      name: member.displayName || member.email,
      membersIds: [member.uid],
    };

    const sameSubgroup = component.subgroups.find(
      (subgroup) => subgroup.name === createSubgroup.name
    );

    if (sameSubgroup && sameSubgroup.membersIds.includes(member.uid))
      return toast.error('Subgroup for this member already exists');
    else if (sameSubgroup && !sameSubgroup.membersIds.includes(member.uid)) {
      // subgroup already exists, add the member to it
      const newSubgroup: Subgroup = {
        ...sameSubgroup,
        membersIds: [...sameSubgroup.membersIds, member.uid],
        stats: [...sameSubgroup.stats].map((value) => ({
          ...value,
          numMembers: value.numMembers + 1,
        })),
      };

      let newSubgroups = [...component.subgroups].map((subgroup) =>
        subgroup.membersIds.includes(member.uid)
          ? {
              ...subgroup,
              membersIds: subgroup.membersIds.filter((id) => id !== member.uid),
              stats: [...subgroup.stats].map((value) => ({
                ...value,
                numMembers: value.numMembers - 1,
              })),
            }
          : subgroup
      );

      newSubgroups = [...newSubgroups].map((subgroup) =>
        subgroup.id === newSubgroup.id ? newSubgroup : subgroup
      );

      const newComponent = { ...component, subgroups: newSubgroups };
      setComponent(newComponent);
      setTraining({
        ...training,
        components: training.components.map((c) =>
          c.id === newComponent.id ? newComponent : c
        ),
      });

      setDetectedChanges(true);
      return;
    }

    // check if the member already exists in a subgroup and if he does, remove him from that subgroup
    const memberSubgroup = component.subgroups.find((subgroup) =>
      subgroup.membersIds.includes(member.uid)
    );

    if (memberSubgroup) {
      // member already exists in a subgroup, remove him from it
      const newSubgroups = [...component.subgroups].map((subgroup) =>
        subgroup.membersIds.includes(member.uid)
          ? {
              ...subgroup,
              membersIds: subgroup.membersIds.filter((id) => id !== member.uid),
              stats: [...subgroup.stats].map((value) => ({
                ...value,
                numMembers: value.numMembers - 1,
              })),
            }
          : subgroup
      );

      const supersets = [...component.supersets].map((s) => ({
        ...s,
        exercises: [...s.exercises].map((e) => ({ ...e })),
      }));

      const newComponent = {
        ...component,
        subgroups: newSubgroups,
        supersets: supersets,
      };

      await handleAddSubgroup({
        training,
        setTraining,
        component: newComponent!,
        setComponent,
        createSubgroup,
        setCreateSubgroup: undefined,
        filteredTrainings,
        setFilteredTrainings,
        setDetectedChanges,
      });

      return;
    }

    await handleAddSubgroup({
      training,
      setTraining,
      component: component!,
      setComponent,
      createSubgroup,
      setCreateSubgroup: undefined,
      filteredTrainings,
      setFilteredTrainings,
      setDetectedChanges,
      updateTrainingsAvgFutureWorkload: true,
    });
  }

  const handleOnDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) {
      const user = members.find((m) => m.uid === draggableId);
      if (!user) return;
      await handleAddMembersSubgroup(user);
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
        setFilteredTrainings,
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
                        if (subgroupIndex > 0)
                          setSelectedSubgroup({
                            subgroup: subgroup || null,
                            index: subgroupIndex - 1,
                          });
                        else if (subgroupIndex === 0) setSelectedSubgroup(null);
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
                                  setEditSubgroupName(
                                    selectedSubgroup.subgroup.name
                                  );
                                  setEditedSubgroup(subgroup);
                                  handleMenuClose();
                                }}
                              >
                                Edit Name
                              </MenuItem>

                              {/* Delete Option */}
                              <MenuItem
                                onClick={() => {
                                  if (!component || !selectedSubgroup?.subgroup)
                                    return;
                                  handleDeleteSubgroup(
                                    {
                                      subgroupId: selectedSubgroup?.subgroup.id,
                                    },
                                    {
                                      training,
                                      setTraining,
                                      component,
                                      setComponent,
                                      filteredTrainings,
                                      setFilteredTrainings,
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
                            const member = members.find(
                              (user) => user.uid === memberId
                            );

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
                                      borderRadius={
                                        selectedAthlete === member ? '50%' : 0
                                      }
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
                                          groupMembers.find(
                                            (m) => m.id === member.uid
                                          )?.profileImageUrl ||
                                          '/user_avatar.png'
                                        }
                                        sx={{
                                          width: screenSize.isMobile ? 40 : 50,
                                          height: screenSize.isMobile ? 40 : 50,
                                          m:
                                            selectedAthlete === member
                                              ? 0.25
                                              : 0.5,
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
