'use client';

import { useEffect, useState } from 'react';
import { COLOR } from '@/common/constant/browser.constant';
import {
  ExerciseMeta,
  Superset,
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Update } from '@mui/icons-material';
import { Box, Tooltip, IconButton, Typography } from '@mui/material';
import {
  addSuperset,
  deleteExercise,
  filterExercises,
  updateExercise,
} from './state';
import TrainingExerciseCard from './training-exercise-card';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BorderColor from '@/components/border-color';
import { Training } from '@/controller/training/type/training.type';
import { Component } from '@/controller/component/type/component.type';
import { SetState } from '@/common/type/state.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { FilteredExercises } from './type';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import MyModal from '../modal';
import AddExerciseModal from './add-exercise-modal';

interface SupersetsProps {
  supersets: Superset[];
  token: string;
  training: Training;
  component: TrainingComponent;
  setSelectedTrainings: SetState<Training[]>;
  components: Component[];
  exercises: Exercise[];
  filteredExercises: FilteredExercises;
  setFilteredExercises: SetState<FilteredExercises>;
}

export default function Supersets(props: SupersetsProps) {
  const {
    supersets,
    token,
    training,
    component,
    setSelectedTrainings,
    components,
    exercises,
    filteredExercises,
    setFilteredExercises,
  } = props;

  const [openAddExcerciseModal, setOpenAddExcerciseModal] = useState(false);
  const [supersetsWithAdd, setSupersetsWithAdd] =
    useState<Superset[]>(supersets);

  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >(supersets.map((superset) => Object.values(superset.exercises)).flat());

  useEffect(() => {
    if (supersets.length < 4) {
      setSupersetsWithAdd([...supersets, { exercises: {}, order: 100 }]);
    } else {
      setSupersetsWithAdd([...supersets]); // Don't include placeholder when max is reached
    }
  }, [supersets]);

  useEffect(() => {
    setSelectedExercises(
      supersets.map((superset) => Object.values(superset.exercises)).flat()
    );
  }, [supersets, supersets.length]);

  const onDragEnd = async (result: any) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    console.log(destination, draggableId);

    if ((destination.droppableId as string).endsWith('100')) {
      //we want to add a new superset and the component to it
      if (supersets.length >= 4) {
        toast.error('You can only have 4 supersets per component');
        return;
      }
      try {
        await addSuperset(
          token,
          training.id,
          component.id,
          {
            color: COLOR[(component.supersets?.length || 0) % COLOR.length],
          },
          setSelectedTrainings,
          components,
          exercises
        );
        toast.success('Superset added successfully');
      } catch (e) {
        toast.error('Failed to add superset');
        console.error(e);
      }
    } else {
    }
  };

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
                    <BorderColor color={superset.color || COLOR[i]} />

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
                                          training.id,
                                          component.id,
                                          i,
                                          exercise.id,
                                          {},
                                          setSelectedTrainings,
                                          components,
                                          exercises
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
                                          training.id,
                                          component.id,
                                          i,
                                          exercise.id,
                                          {
                                            color: `#${Math.floor(
                                              Math.random() * 16777215
                                            )
                                              .toString(16)
                                              .padStart(6, '0')}`,
                                            order: 0,
                                          },
                                          setSelectedTrainings,
                                          components,
                                          exercises
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
                                    await updateExercise(
                                      token,
                                      training.id,
                                      component.id,
                                      i,
                                      exercise.id,
                                      {
                                        meta: meta as ExerciseMeta,
                                      },
                                      setSelectedTrainings,
                                      components,
                                      exercises
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

                    <BorderColor color={superset.color || COLOR[i]} lower />

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
                              setFilteredExercises((prev) => ({
                                ...prev,
                                show: true,
                                componentId: component.id,
                                superset: i,
                              }));
                              setOpenAddExcerciseModal(true);
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

      {/* Members modal */}
      <MyModal
        isOpen={openAddExcerciseModal}
        setIsOpen={(open) => setOpenAddExcerciseModal(open)}
        onCancel={() => setOpenAddExcerciseModal(false)}
        onConfirm={() => setOpenAddExcerciseModal(false)}
        cancelText="Close"
      >
        <AddExerciseModal
          token={token}
          training={training}
          filteredExercises={filteredExercises}
          setSelectedTrainings={setSelectedTrainings}
          components={components}
          exercises={exercises}
          selectedExercises={selectedExercises}
          setSelectedExercises={setSelectedExercises}
        />
      </MyModal>
    </DragDropContext>
  );
}
