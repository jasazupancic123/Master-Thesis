'use client';

import { COLOR } from '@/common/constant/browser.constant';
import BorderColor from '@/components/border-color';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Effort } from '@/controller/training/enum/effort.enum';
import { SetType } from '@/controller/training/enum/set-type.enum';
import { WorkloadType } from '@/controller/training/enum/workload-type.enum';
import {
  ExerciseMeta,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
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
import TrainingExerciseCard from './training-exercise-card';

export default function Supersets() {
  const screenSize = useScreenSize();
  const {
    training,
    setTraining,
    component,
    exercises: allExercises,
  } = useGroup();

  const supersets = component?.supersets || [];
  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [supersetsWithAdd, setSupersetsWithAdd] = useState(supersets);
  const [selectedExercisesIds, setSelectedExercisesIds] = useState(
    supersets.flatMap((s) => s.exercises.map((e) => e.id))
  );

  useEffect(() => {
    setSelectedExercisesIds(
      supersets.flatMap((s) => s.exercises.map((e) => e.id))
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (!component) setSelectedExercisesIds([]);
  }, [component]);

  async function onDragEnd({ destination, draggableId }: any) {
    if (!destination || !training || !component) return;

    if ((destination.droppableId as string).endsWith('100')) {
      if (supersets.length >= 4)
        return toast.error('You can only have 4 supersets per component');
    } else {
      const supersetIndex = parseInt(destination.droppableId.split('-')[1]);
      const supersetsCopy = [...supersetsWithAdd];

      // in supersets, find the superset that has the exercise
      const supersetWithExercise = supersetsCopy.find((superset) =>
        superset.exercises.includes(draggableId)
      );

      if (!supersetWithExercise) return;

      const exerciseIndex = supersetWithExercise.exercises.findIndex(
        (e) => e.id === draggableId
      );

      if (!exerciseIndex || exerciseIndex === -1) return;
      supersetsCopy[supersetIndex].exercises[exerciseIndex] =
        supersetWithExercise.exercises[exerciseIndex];

      delete supersetWithExercise.exercises[draggableId];
      setSupersetsWithAdd([...supersetsCopy]);
    }
  }

  if (!component || !training) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {supersetsWithAdd.map((superset, i) => (
          <Droppable
            key={`${component.id}-${i}`}
            droppableId={`${component.id}-${i}`}
            direction="vertical"
          >
            {(provided) => (
              <>
                {/* {supersets.length >= 4 ? (
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
                    sx={{ maxHeight: 150, cursor: 'pointer' }}
                  >
                    <Typography variant="body2" ml={1}>
                      Drop here to add a new superset
                    </Typography>
                  </Box>
                )} */}

                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  flexBasis={
                    !screenSize.isSmallerThanLaptop
                      ? { xs: '25%', sm: '25%', md: '24%' }
                      : undefined
                  }
                  p={2}
                  width={
                    screenSize.isSmallerThanLaptop
                      ? { xs: '100%', sm: '100%', md: '24%' }
                      : undefined
                  }
                  display="flex"
                  flexDirection="column"
                >
                  <BorderColor color={superset.color || COLOR[i]} />

                  <Box>
                    {superset.exercises.map((exercise, k) => (
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
                              snapshot.isDragging ? '#f0f0f0' : 'transparent'
                            }
                            p={1}
                            borderRadius={1}
                            boxShadow={snapshot.isDragging ? 2 : 0}
                          >
                            <Box
                              position="absolute"
                              top={5}
                              right={5}
                              display="flex"
                              flexDirection="column"
                            >
                              <Tooltip title="Delete exercise" placement="left">
                                <IconButton size="small">
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Update exercise" placement="left">
                                <IconButton size="small">
                                  <Update />
                                </IconButton>
                              </Tooltip>
                            </Box>

                            <TrainingExerciseCard
                              exercise={exercise}
                              onChange={() => {}}
                            />
                          </Box>
                        )}
                      </Draggable>
                    ))}

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
                          onClick={() => setOpenAddExerciseModal(true)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </Droppable>
        ))}
      </Box>

      {/* Component exercises modal */}
      <MyModal
        isOpen={openAddExerciseModal}
        setIsOpen={(open) => setOpenAddExerciseModal(open)}
        cancelText="Close"
        onCancel={() => setOpenAddExerciseModal(false)}
        onConfirm={() => {
          const exercisesToAdd: TrainingExercise[] = selectedExercisesIds.map(
            (id) => ({
              id,
              exercise: allExercises.find((e) => e.id === id) || null,
              meta: {
                sets: 3,
                setType: SetType.REPS,
                setTypeValue: 12,
                workloadType: WorkloadType.KG,
                workloadValue: 60,
                rec: 30,
              },
            })
          );

          // get training component index
          const trainingComponentIndex = training.components.findIndex(
            (c) => c.id === component.id
          );

          // last superset index
          const supersets =
            training.components[trainingComponentIndex].supersets;
          const lastSupersetIndex =
            supersets.length <= 1 ? 0 : supersets.length - 1;

          // number of exercises
          const exercises = supersets[lastSupersetIndex].exercises;
          const remainingSpaceInLastSuperset = 4 - exercises.length;

          // exercises into chunks of 4
          const chunkSize = 4;
          const exerciseChunks = [];
          for (let i = 0; i < exercisesToAdd.length; i += chunkSize)
            exerciseChunks.push(exercisesToAdd.slice(i, i + chunkSize));

          // update the last superset with the first chunk (if there's space)
          const updatedSupersets = [...supersets];
          if (exerciseChunks.length > 0 && remainingSpaceInLastSuperset > 0) {
            const firstChunk = exerciseChunks[0].slice(
              0,
              remainingSpaceInLastSuperset
            );

            updatedSupersets[lastSupersetIndex] = {
              ...updatedSupersets[lastSupersetIndex],
              exercises: [
                ...updatedSupersets[lastSupersetIndex].exercises,
                ...firstChunk,
              ],
            };

            exerciseChunks[0] = exerciseChunks[0].slice(
              remainingSpaceInLastSuperset
            );

            if (exerciseChunks[0].length === 0) exerciseChunks.shift(); // remove the chunk if empty
          }

          // add remaining chunks as new supersets (up to a maximum of 4 supersets)
          for (const chunk of exerciseChunks) {
            if (updatedSupersets.length >= 4) break; // reached max number of supersets
            updatedSupersets.push({ color: undefined, exercises: chunk });
          }

          setSupersetsWithAdd(updatedSupersets);

          const updatedComponents = [...training.components];
          updatedComponents[trainingComponentIndex] = {
            ...updatedComponents[trainingComponentIndex],
            supersets: updatedSupersets,
          };

          setTraining({ ...training, components: updatedComponents });
          setOpenAddExerciseModal(false);
        }}
      >
        <AddExerciseForm
          selectedExercisesIds={selectedExercisesIds}
          setSelectedExercisesIds={setSelectedExercisesIds}
        />
      </MyModal>
    </DragDropContext>
  );
}
