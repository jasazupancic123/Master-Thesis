'use client';

import { useState } from 'react';
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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { SetState } from '@/common/type/state.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';

const defaultSubgroup: Subgroup = {
  id: 'default',
  name: 'Default',
  membersIds: [],
  components: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function Subgroups(props: SubgroupsProps) {
  const [showSubgroups, setShowSubgroups] = useState(false);

  const subgroupsWithDefault = [
    defaultSubgroup,
    ...(props.selected.group?.subgroups || []),
  ];

  const onDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const updatedGroup = { ...props.group };

    // Remove member from all subgroups, including the default subgroup
    [defaultSubgroup, ...updatedGroup.subgroups].forEach((subgroup) => {
      subgroup.membersIds = subgroup.membersIds.filter(
        (id) => id !== draggableId
      );
    });

    // Add member to the new subgroup
    if (destination.droppableId === 'default') {
      defaultSubgroup.membersIds.push(draggableId);
    } else if (destination.droppableId === 'available-members') {
      updatedGroup.availableMembersIds?.push(draggableId);
    } else {
      const targetSubgroup = updatedGroup.subgroups.find(
        (s) => s.id === destination.droppableId
      );
      if (targetSubgroup) {
        targetSubgroup.membersIds.push(draggableId);
      }
      updatedGroup.availableMembersIds =
        updatedGroup.availableMembersIds?.filter((id) => id !== draggableId);
    }

    // Ensure the default subgroup updates when a member is removed from it
    defaultSubgroup.membersIds = defaultSubgroup.membersIds.filter(
      (id) => !updatedGroup.subgroups.some((s) => s.membersIds.includes(id))
    );

    props.setSelected((prev) => ({ ...prev, group: updatedGroup }));
  };

  const handleRightClick = (memberId: string) => {
    const updatedGroup = { ...props.group };

    updatedGroup.subgroups.forEach((subgroup) => {
      subgroup.membersIds = subgroup.membersIds.filter((id) => id !== memberId);
    });

    if (!updatedGroup.availableMembersIds?.includes(memberId)) {
      updatedGroup.availableMembersIds?.push(memberId);
    }

    props.setSelected((prev) => ({ ...prev, group: updatedGroup }));
  };

  const handleDelete = (subgroupId: string) => {
    const updatedGroup = { ...props.group };
    const deletedSubgroup = updatedGroup.subgroups.find(
      (subgroup) => subgroup.id === subgroupId
    );

    updatedGroup.subgroups = updatedGroup.subgroups.filter(
      (subgroup) => subgroup.id !== subgroupId
    );

    if (deletedSubgroup) {
      updatedGroup.availableMembersIds = [
        ...updatedGroup.availableMembersIds!,
        ...deletedSubgroup.membersIds!,
      ];
    }
    props.setSelected((prev) => ({ ...prev, group: updatedGroup }));
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

      {showSubgroups && props.selected?.group?.subgroups && (
        <>
          <Box
            sx={{
              width: '100%',
              display:
                props.selected.group.subgroups.length % 3 === 0
                  ? 'flex'
                  : 'grid',
              flexWrap: 'wrap',
              gridTemplateColumns:
                props.selected.group.subgroups.length > 0
                  ? 'repeat(3, minmax(300px, 1fr))'
                  : 'minmax(300px, 1fr)',
              justifyContent:
                props.selected.group.subgroups.length % 3 !== 0
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
                      border: `1px solid ${props.borderColors[index % 20]}`,
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
                            props.setModal({ edit_subgroup: true });
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
                          const user = props.group.members?.find(
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
