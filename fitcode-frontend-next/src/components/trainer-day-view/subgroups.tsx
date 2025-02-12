'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { SetState } from '@/common/type/state.type';
import { COLORS } from '@/common/constant/color.constant';
import {
  Box,
  Tooltip,
  Avatar,
  Switch,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
} from '@mui/material';
import { SubgroupsProps } from './type';
import { User } from '@/controller/user/type/user.type';
import { TrainingController } from '@/controller/training/training.controller';
import toast from 'react-hot-toast';

export default function Subgroups(props: SubgroupsProps) {
  const { token, training, setSelectedTraining, setTrainings, setModal } =
    props;

  const [showSubgroups, setShowSubgroups] = useState(false);

  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [detectedSubgroupChanges, setDetectedSubgroupChanges] = useState(false);
  const [changedSubgroupIds, setChangedSubgroupIds] = useState<string[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>(
    Object.values(training.subgroups)
  );

  useEffect(() => {
    if (!props.training) return;

    const members: string[] = [];
    for (const subgroup of subgroups) {
      members.push(...subgroup.membersIds);
    }

    const ids = props.training.membersIds.filter((id) => !members.includes(id));

    setAvailableMembers(props.users.filter((user) => ids.includes(user.uid)));
  }, [props.training, showSubgroups]);

  useEffect(() => {
    setSubgroups(Object.values(training.subgroups));
    console.log('new subgroups:', Object.values(training.subgroups));
  }, [training]);

  const defaultSubgroup: Subgroup = {
    id: 'default',
    name: 'Default',
    membersIds: availableMembers.map((user) => user.uid),
    components: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const subgroupsWithDefault = [defaultSubgroup, ...(subgroups || [])];

  const onDragEnd = (result: any) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    // remove member from all subgroups, including the default subgroup
    const updatedTraining = { ...training };
    const updated_subgroups = Object.values(updatedTraining.subgroups);

    //find from which subgroup the member is being dragged and add it to changedSubgroupIds
    const fromSubgroup = updated_subgroups.find((s) =>
      s.membersIds.includes(draggableId)
    );
    if (fromSubgroup && !changedSubgroupIds.includes(fromSubgroup.id)) {
      setChangedSubgroupIds((prev) => [...prev, fromSubgroup.id]);
    }

    [defaultSubgroup, ...updated_subgroups].forEach((s) => {
      if (!s.membersIds) return;
      s.membersIds = s.membersIds.filter((id) => id !== draggableId);
    });

    // Add member to the new subgroup
    if (destination.droppableId === 'default') {
      if (!availableMembers.some((user) => user.uid === draggableId)) {
        setAvailableMembers((prev) => [
          ...prev,
          props.users.find((user) => user.uid === draggableId)!,
        ]);
      }
    } else {
      const targetSubgroup = updated_subgroups.find(
        (s) => s.id === destination.droppableId
      );

      if (targetSubgroup) targetSubgroup.membersIds.push(draggableId);

      setAvailableMembers((prev) =>
        prev.filter((user) => user.uid !== draggableId)
      );

      if (targetSubgroup && !changedSubgroupIds.includes(targetSubgroup.id)) {
        setChangedSubgroupIds((prev) => [...prev, targetSubgroup.id]);
      }
    }

    setTrainings((prev) =>
      prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
    );

    setDetectedSubgroupChanges(true);
    setSubgroups(updated_subgroups);
  };

  const handleRightClick = (memberId: string) => {
    const updatedTraining = { ...training };
    const updated_subgroups = Object.values(updatedTraining.subgroups);

    updated_subgroups.forEach((s) => {
      s.membersIds = s.membersIds.filter((id) => id !== memberId);
    });
    setAvailableMembers((prev) => [
      ...prev,
      props.users.find((user) => user.uid === memberId)!,
    ]);
    setDetectedSubgroupChanges(true);
  };

  const handleDelete = (subgroupId: string) => {
    const updatedTraining = { ...training };
    const updated_subgroups = Object.values(updatedTraining.subgroups);

    const deletedSubgroup = updated_subgroups.find((s) => s.id === subgroupId);
    updatedTraining.subgroups = updated_subgroups
      .filter((s) => s.id !== subgroupId)
      .reduce(
        (acc, s) => {
          acc[s.id] = s;
          return acc;
        },
        {} as { [key: string]: Subgroup }
      );

    if (deletedSubgroup)
      updatedTraining.membersIds = [
        ...updatedTraining.membersIds!,
        ...deletedSubgroup.membersIds!,
      ];

    setTrainings((prev) =>
      prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
    );
    setDetectedSubgroupChanges(true);
  };

  const handleSaveSubgroupChanges = async () => {
    try {
      // update subgroups here
      toast.success('Subgroup changes saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save subgroup changes');
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Subgroups Section */}
      <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Switch
            checked={showSubgroups}
            onChange={() => setShowSubgroups((prev) => !prev)}
          />
          <Typography>Show Subgroups</Typography>
        </Box>
        {detectedSubgroupChanges && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSaveSubgroupChanges()}
            sx={{
              mt: 1,
            }}
          >
            Save Subgroup Changes
          </Button>
        )}
      </Box>

      {showSubgroups && (
        <>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="100%"
            mt={1}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <InfoIcon sx={{ fontSize: 20, mb: 0.5, mr: 0.5 }} /> Drag and drop
              a member inside a subgroup from Default. Remove members of
              subgroups by right-clicking on them.
            </Typography>
          </Box>
        </>
      )}

      {showSubgroups && (
        <>
          <Box
            sx={{
              width: '100%',
              display: subgroups.length % 3 === 0 ? 'flex' : 'grid',
              flexWrap: 'wrap',
              gridTemplateColumns:
                subgroups.length > 0
                  ? 'repeat(3, minmax(300px, 1fr))'
                  : 'minmax(300px, 1fr)',
              justifyContent: subgroups.length % 3 !== 0 ? 'center' : 'initial',
              gap: 2,
              pl: 5,
              pr: 5,
            }}
          >
            {/* Render Subgroups */}
            {subgroupsWithDefault.map((subgroup, index) => (
              <Droppable
                key={subgroup.id}
                droppableId={subgroup.id}
                direction="horizontal"
              >
                {(provided) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      flex: '1 1 70%',
                      minWidth: 250,
                      maxWidth: 500,
                      minHeight: 210,
                      maxHeight: 210,
                      margin: 1,
                      transition: 'border 0.2s',
                      border: `1px solid ${COLORS[index % 20]}`,
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative', // Needed for absolute positioning of icons
                    }}
                  >
                    {/* Icons for edit and delete */}
                    {subgroup.id !== 'default' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          pt: 1.5,
                          right: 5,
                          display: 'flex',
                          gap: 0,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => {
                            setModal((prev) => ({
                              ...prev,
                              editSubgroup: true,
                            }));
                            props.setEditedSubgroup(subgroup as Subgroup);
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(subgroup.id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}

                    <CardContent
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      <Typography sx={{ marginBottom: 1 }}>
                        {subgroup.name}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          maxHeight: 160,
                          padding: 1,
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        {subgroup.membersIds?.map((id, idx) => {
                          const userId = training.membersIds.find(
                            (memberId) => memberId === id
                          );
                          const user = props.users.find(
                            (user) => user.uid === userId
                          );

                          return (
                            user && (
                              <Draggable
                                key={user.uid}
                                draggableId={user.uid}
                                index={idx}
                              >
                                {(provided, snapshot) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onContextMenu={(event) => {
                                      event.preventDefault(); // Prevent default right-click menu
                                      handleRightClick(user.uid);
                                    }}
                                    sx={{
                                      cursor: 'grab',
                                      opacity: snapshot.isDragging ? 0.6 : 1, // Reduce opacity while dragging
                                      transition: 'opacity 0.2s ease',
                                    }}
                                  >
                                    <Tooltip title={user.email} arrow>
                                      <Avatar
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          margin: 1,
                                        }}
                                      >
                                        {user.email[0].toUpperCase()}
                                      </Avatar>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Draggable>
                            )
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            ))}
            {/* Add New Subgroup Button */}
            <Card
              onClick={() =>
                props.setModal((prev: any) => ({
                  ...prev,
                  subgroup: true,
                }))
              }
              sx={{
                flex: '1 1 70%',
                minWidth: 250,
                maxWidth: 500,
                minHeight: 210,
                maxHeight: 210,
                margin: 1,
                transition: 'border 0.2s',
                border: '1px dashed #999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Typography variant="h3" sx={{ color: '#666' }}>
                +
              </Typography>
            </Card>
          </Box>
        </>
      )}
    </DragDropContext>
  );
}
