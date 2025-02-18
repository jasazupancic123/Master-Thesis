'use client';

import { COLORS } from '@/common/constant/color.constant';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { TrainingService } from '@/controller/training/training.service';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { User } from '@/controller/user/type/user.type';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import MyModal from '../modal';
import { DEFAULT_SUBGROUP } from './constant';
import {
  handleRightClickSubgroup,
  handleSaveSubgroupChanges,
  onDragEndSubgroup,
} from './state';

export default function Subgroups() {
  const screenSize = useScreenSize();
  const router = useRouter();
  const {
    token,
    training,
    component,
    setTrainings,
    setTraining,
    setFilteredTrainings,
    users,
    components,
    exercises,
  } = useGroup();

  const [showSubgroups, setShowSubgroups] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<User[]>([]);

  const [detectedSubgroupChanges, setDetectedSubgroupChanges] = useState(false);
  const [changedSubgroupIds, setChangedSubgroupIds] = useState<string[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);

  const [editedSubgroup, setEditedSubgroup] = useState<Subgroup | null>(null);
  const [modal, setModal] = useState({ subgroup: false, editSubgroup: false });
  const [createSubgroup, setCreateSubgroup] = useState({
    name: '',
    membersIds: [] as string[],
  });

  useEffect(() => {
    if (!training || !component) return;

    setSubgroups(component.subgroups);
    setAvailableMembers(
      TrainingService.mapAvailableMembers(training).availableMembersIds!.map(
        (userId) => users.find((u) => u.uid === userId)!
      )
    );
  }, [training]);

  if (!training) return null;

  return (
    <>
      <DragDropContext
        onDragEnd={(result) =>
          onDragEndSubgroup(result, {
            subgroups,
            setSubgroups,
            changedSubgroupIds,
            setChangedSubgroupIds,
            availableMembers,
            setAvailableMembers,
            users,
            setDetectedSubgroupChanges,
            setTraining,
          })
        }
      >
        {/* Subgroups Section */}
        <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Switch
              checked={showSubgroups}
              onChange={() => setShowSubgroups((prev) => !prev)}
            />
            <Typography>Show Subgroups</Typography>
          </Box>

          {detectedSubgroupChanges && showSubgroups && (
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                handleSaveSubgroupChanges(token, {
                  router,
                  training,
                  setTraining,
                  setTrainings,
                  setFilteredTrainings,
                  subgroups,
                  setSubgroups,
                  setDetectedSubgroupChanges,
                  components,
                  exercises,
                })
              }
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
              sx={{
                width: '100%',
                display:
                  screenSize.isMobile || screenSize.isLandscapeMobile
                    ? 'flex'
                    : subgroups.length % 3 === 0
                      ? 'flex'
                      : 'grid',
                flexWrap: 'wrap',
                gridTemplateColumns:
                  subgroups.length > 0
                    ? 'repeat(3, minmax(300px, 1fr))'
                    : 'minmax(300px, 1fr)',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                px: 5,
              }}
            >
              {/* Render Subgroups */}
              {[DEFAULT_SUBGROUP(availableMembers), ...(subgroups || [])].map(
                (subgroup, index) => (
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
                          maxWidth: screenSize.isLaptop ? 420 : 500,
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
                                setEditedSubgroup(subgroup as Subgroup);
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>

                            <IconButton size="small" sx={{ p: 0.5 }}>
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
                              const userId = training!.membersIds.find(
                                (memberId) => memberId === id
                              );
                              const user = users.find(
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
                                          event.preventDefault(); // prevent default right-click menu
                                          handleRightClickSubgroup(
                                            {
                                              memberId: user.uid,
                                              subgroupId: subgroup.id,
                                            },
                                            {
                                              subgroups,
                                              setSubgroups,
                                              training,
                                              setTraining,
                                              setFilteredTrainings,
                                              setTrainings,
                                              setAvailableMembers,
                                              users,
                                              setDetectedSubgroupChanges,
                                            }
                                          );
                                        }}
                                        sx={{
                                          cursor: 'grab',
                                          opacity: snapshot.isDragging
                                            ? 0.6
                                            : 1, // Reduce opacity while dragging
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
                )
              )}

              {/* Add New Subgroup Button */}
              <Card
                onClick={() =>
                  setModal((prev: any) => ({
                    ...prev,
                    subgroup: true,
                  }))
                }
                sx={{
                  flex: '1 1 70%',
                  minWidth: 250,
                  maxWidth: screenSize.isLaptop ? 420 : 500,
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

      {/* Create subgroup modal */}
      <MyModal
        isOpen={modal.subgroup}
        setIsOpen={(subgroup) => setModal((prev) => ({ ...prev, subgroup }))}
        title="Create Subgroup"
        onCancel={() => setModal((prev) => ({ ...prev, subgroup: false }))}
        onConfirm={() => {
          setModal((prev) => ({ ...prev, subgroup: false }));
        }}
      >
        <Stack spacing={4} p={1}>
          {/* Name */}
          <TextField
            label="Name"
            fullWidth
            variant="outlined"
            size="small"
            value={createSubgroup.name}
            onChange={(e) =>
              setCreateSubgroup((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </Stack>
      </MyModal>

      {/* Edit subgroup modal */}
      <MyModal
        isOpen={modal.editSubgroup}
        setIsOpen={(editSubgroup) =>
          setModal((prev) => ({ ...prev, editSubgroup }))
        }
        title="Edit Subgroup"
        onCancel={() => {
          setModal((prev) => ({ ...prev, editSubgroup: false }));
          setEditedSubgroup(null);
        }}
        onConfirm={() => console.log('edit')}
      >
        <Stack spacing={4} p={1}>
          {/* Name */}
          <TextField
            label="Name"
            fullWidth
            value={editedSubgroup?.name || ''}
            variant="outlined"
            size="small"
            onChange={(e) =>
              setEditedSubgroup((prev) => {
                if (!prev) return prev;
                return { ...prev, name: e.target.value };
              })
            }
          />
        </Stack>
      </MyModal>
    </>
  );
}
