'use client';

import { COLOR } from '@/common/constant/browser.constant';
import BorderColor from '@/components/border-color';
import { useGroup } from '@/context/group-provider';
import { ExerciseMeta } from '@/controller/training/type/training-plan.type';
import { Update } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import MyModal from '../modal';
import AddExerciseForm from './add-exercise-form';
import { SupersetsProps } from './props';
import {
  addSuperset,
  deleteExercise,
  deleteSuperset,
  updateExercise,
} from './state';
import TrainingExerciseCard from './training-exercise-card';

export default function Supersets(props: SupersetsProps) {
  const { trainingComponent } = props;

  const {
    token,
    training,
    setTraining,
    setFilteredTrainings,
    setTrainings,
    component,
    components,
    exercises,
  } = useGroup();

  const supersets = trainingComponent.supersets || [];

  const router = useRouter();
  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [supersetsWithAdd, setSupersetsWithAdd] = useState(supersets);
  const [selectedExercises, setSelectedExercises] = useState(
    supersets.map((superset) => Object.values(superset.exercises)).flat()
  );

  useEffect(() => {
    if (supersets.length < 4)
      setSupersetsWithAdd([...supersets, { exercises: {}, order: 100 }]);
    else setSupersetsWithAdd([...supersets]); // don't include placeholder when max is reached
  }, [supersets]);

  useEffect(() => {
    setSelectedExercises(
      supersets.map((superset) => Object.values(superset.exercises)).flat()
    );
  }, [supersets, supersets.length]);

  async function onDragEnd({ destination }: any) {
    if (!destination || !training || !component) return;

    if ((destination.droppableId as string).endsWith('100')) {
      if (supersets.length >= 4)
        return toast.error('You can only have 4 supersets per component');

      addSuperset(
        token,
        {
          color:
            COLOR[(trainingComponent.supersets?.length || 0) % COLOR.length],
          trainingId: training.id,
          componentId: component.id,
        },
        {
          router,
          setFilteredTrainings,
          setTrainings,
          setTraining,
          components,
          exercises,
        }
      );
    }
  }

  async function handleDeleteSuperset(order: number) {
    if (!training || !component) return;

    deleteSuperset(
      token,
      {
        trainingId: training.id,
        componentId: component.id,
        superset: order,
      },
      {
        router,
        setTraining,
        setTrainings,
        setFilteredTrainings,
        components,
        exercises,
      }
    );
  }

  if (!component || !training) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {supersetsWithAdd
          ?.sort((a, b) => a.order - b.order)
          ?.map((superset, i) => (
            <Droppable
              key={`${component.id}-${i}-${superset.order}`}
              droppableId={`${component.id}-${i}-${superset.order}`}
              direction="vertical"
            >
              {(provided) =>
                superset.order === 100 ? (
                  supersets.length >= 4 ? (
                    <></>
                  ) : (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      display="flex"
                      width={{ xs: '100%', sm: '100%', md: '24%' }}
                      alignItems="center"
                      justifyContent="center"
                      border="1px dashed #B2B3B7"
                      borderRadius={2}
                      p={2}
                      mt={2}
                      sx={{
                        maxHeight: 150,
                        cursor: 'pointer',
                      }}
                    >
                      <Typography variant="body2" ml={1}>
                        Drop here to add a new superset
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    flexBasis={{ xs: '25%', sm: '25%', md: '24%' }}
                    p={2}
                    display="flex"
                    flexDirection="column"
                  >
                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        handleDeleteSuperset(supersets.indexOf(superset))
                      }
                    >
                      <BorderColor color={superset.color || COLOR[i]} />
                    </Box>

                    <Box>
                      {Object.values(superset?.exercises || {})?.map(
                        (exercise, k) => (
                          <Draggable
                            key={exercise.id}
                            draggableId={exercise.id.toString()}
                            index={k}
                          >
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                position="relative"
                                bgcolor={
                                  snapshot.isDragging
                                    ? '#f0f0f0'
                                    : 'transparent'
                                }
                                p={1}
                                borderRadius={1}
                                boxShadow={snapshot.isDragging ? 2 : 0}
                              >
                                <Box position="absolute" top={5} right={5}>
                                  <Tooltip
                                    title="Delete exercise"
                                    placement="left"
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        deleteExercise(
                                          token,
                                          {
                                            trainingId: training.id,
                                            componentId: component.id,
                                            superset: i,
                                            exerciseId: exercise.id,
                                          },
                                          {
                                            router,
                                            setTraining,
                                            setTrainings,
                                            setFilteredTrainings,
                                            components,
                                            exercises,
                                          }
                                        )
                                      }
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip
                                    title="Update exercise"
                                    placement="left"
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        updateExercise(
                                          token,
                                          {
                                            trainingId: training.id,
                                            componentId: component.id,
                                            superset: i,
                                            exerciseId: exercise.id,
                                            color: `#${Math.floor(
                                              Math.random() * 16777215
                                            )
                                              .toString(16)
                                              .padStart(6, '0')}`,
                                            order: 0,
                                          },
                                          {
                                            router,
                                            setTraining,
                                            setTrainings,
                                            setFilteredTrainings,
                                            components,
                                            exercises,
                                          }
                                        )
                                      }
                                    >
                                      <Update />
                                    </IconButton>
                                  </Tooltip>
                                </Box>

                                <TrainingExerciseCard
                                  exercise={exercise}
                                  onChange={async (meta) => {
                                    updateExercise(
                                      token,
                                      {
                                        trainingId: training.id,
                                        componentId: component.id,
                                        superset: i,
                                        exerciseId: exercise.id,
                                        meta: meta as ExerciseMeta,
                                      },
                                      {
                                        router,
                                        setTraining,
                                        setTrainings,
                                        setFilteredTrainings,
                                        components,
                                        exercises,
                                      }
                                    );
                                  }}
                                />
                              </Box>
                            )}
                          </Draggable>
                        )
                      )}

                      {provided.placeholder}
                    </Box>

                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        handleDeleteSuperset(supersets.indexOf(superset))
                      }
                    >
                      <BorderColor color={superset.color || COLOR[i]} lower />
                    </Box>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      mt={1}
                      gap={1}
                    >
                      {/* Add exercises to superset */}
                      <Box
                        sx={{
                          border: '1px dashed #B2B3B7',
                          borderRadius: 2,
                          flex: 1,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Tooltip title="Add exercises">
                          <IconButton
                            onClick={() => {
                              setOpenAddExerciseModal(true);
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                )
              }
            </Droppable>
          ))}
      </Box>

      {/* Component exercises modal */}
      <MyModal
        isOpen={openAddExerciseModal}
        setIsOpen={(open) => setOpenAddExerciseModal(open)}
        onCancel={() => setOpenAddExerciseModal(false)}
        onConfirm={() => setOpenAddExerciseModal(false)}
        cancelText="Close"
      >
        <AddExerciseForm
          selectedExercises={selectedExercises}
          setSelectedExercises={setSelectedExercises}
        />
      </MyModal>
    </DragDropContext>
  );
}
