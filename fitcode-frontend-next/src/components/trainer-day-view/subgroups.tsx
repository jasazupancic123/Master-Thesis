'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { SubgroupsProps } from './type';

const defaultSubgroup: Subgroup = {
  id: 'default',
  name: 'Default',
  membersIds: [],
  components: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function Subgroups(props: SubgroupsProps) {
  const { training, setTrainings, setModal } = props;

  const [showSubgroups, setShowSubgroups] = useState(false);

  const subgroupsWithDefault = [
    defaultSubgroup,
    ...(Object.values(training.subgroups) || []),
  ];

  const onDragEnd = (result: any) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    // remove member from all subgroups, including the default subgroup
    const updatedTraining = { ...training };
    const subgroups = Object.values(updatedTraining.subgroups);

    [defaultSubgroup, ...subgroups].forEach((s) => {
      s.membersIds = s.membersIds.filter((id) => id !== draggableId);
    });

    // Add member to the new subgroup
    if (destination.droppableId === 'default')
      defaultSubgroup.membersIds.push(draggableId);
    else if (destination.droppableId === 'available-members')
      updatedTraining.membersIds?.push(draggableId);
    else {
      const targetSubgroup = subgroups.find(
        (s) => s.id === destination.droppableId
      );

      if (targetSubgroup) targetSubgroup.membersIds.push(draggableId);

      updatedTraining.membersIds = updatedTraining.membersIds?.filter(
        (id) => id !== draggableId
      );
    }

    // ensure the default subgroup updates when a member is removed from it
    defaultSubgroup.membersIds = defaultSubgroup.membersIds.filter(
      (id) => !subgroups.some((s) => s.membersIds.includes(id))
    );

    setTrainings((prev) =>
      prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
    );
  };

  const handleRightClick = (memberId: string) => {
    const updatedTraining = { ...training };
    const subgroups = Object.values(updatedTraining.subgroups);

    subgroups.forEach((s) => {
      s.membersIds = s.membersIds.filter((id) => id !== memberId);
    });

    if (!updatedTraining.membersIds?.includes(memberId))
      updatedTraining.membersIds?.push(memberId);

    setTrainings((prev) =>
      prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
    );
  };

  const handleDelete = (subgroupId: string) => {
    const updatedTraining = { ...training };
    const subgroups = Object.values(updatedTraining.subgroups);

    const deletedSubgroup = subgroups.find((s) => s.id === subgroupId);
    updatedTraining.subgroups = subgroups
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
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Subgroups Section */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
        <Switch
          checked={showSubgroups}
          onChange={() => setShowSubgroups((prev) => !prev)}
        />
        <Typography>Show Subgroups</Typography>
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

      {showSubgroups && Object.values(training.subgroups).length > 0 && (
        <>
          <Box
            sx={{
              width: '100%',
              display:
                Object.values(training.subgroups).length % 3 === 0
                  ? 'flex'
                  : 'grid',
              flexWrap: 'wrap',
              gridTemplateColumns:
                Object.values(training.subgroups).length > 0
                  ? 'repeat(3, minmax(300px, 1fr))'
                  : 'minmax(300px, 1fr)',
              justifyContent:
                Object.values(training.subgroups).length % 3 !== 0
                  ? 'center'
                  : 'initial',
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
                          const user = training.members?.find(
                            (m) => m.uid === id
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
