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
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Update } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import MyModal from '../modal';
import AddExerciseForm from './add-exercise-form';
import TrainingExerciseCard from './training-exercise-card';
import { SetState } from '@/common/type/state.type';

interface SupersetsProps {
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
}

export default function Supersets(props: SupersetsProps) {
  const { openAddExerciseModal, setOpenAddExerciseModal } = props;
  const screenSize = useScreenSize();
  const {
    training,
    setTraining,
    component,
    setComponent,
    exercises: allExercises,
  } = useGroup();

  const supersets = component?.supersets || [];
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

    if (destination.droppableId === 'addSupersetDroppable') {
      if (supersets.length >= 4)
        return toast.error('You can only have 4 supersets per component');

      const supersetsCopy = [...supersetsWithAdd];

      const supersetWithExercise = supersetsCopy.find((superset) =>
        superset.exercises.find((e) => e.id === draggableId)
      );
      if (!supersetWithExercise) return;

      const draggedExercise = supersetWithExercise?.exercises.find(
        (e) => e.id === draggableId
      );
      if (!draggedExercise) return;

      const newSuperset = {
        color: undefined,
        exercises: [draggedExercise],
      } as Superset;

      const newSupersets = [...supersetsCopy, newSuperset];

      supersetWithExercise.exercises = supersetWithExercise.exercises.filter(
        (e) => e.id !== draggableId
      );

      setComponent({ ...component, supersets: newSupersets });
      setTraining({
        ...training,
        components: training.components.map((c) =>
          c.id === component.id ? { ...c, supersets: newSupersets } : c
        ),
      });
      setSupersetsWithAdd([...newSupersets]);
      return;
    }

    const supersetIndex = parseInt(destination.droppableId.split('-')[1]);
    const supersetWithNewExercise = supersetsWithAdd[supersetIndex];
    const supersetsCopy = [...supersetsWithAdd];

    const supersetWithExercise = supersetsCopy.find((superset) =>
      superset.exercises.find((e) => e.id === draggableId)
    );

    if (!supersetWithExercise) return;

    if (supersetWithExercise === supersetWithNewExercise) {
      // Get y coordinates of all exercises in the superset
      const sortedExercises = supersetWithExercise.exercises
        .map((e) => ({
          exercise: e,
          y:
            document.getElementById(e.id)?.getBoundingClientRect().top ??
            Infinity, // Default to Infinity if not found
        }))
        .sort((a, b) => a.y - b.y) // Sort by y coordinate
        .map((item) => item.exercise); // Extract only exercises

      const newSuprset = {
        ...supersetWithExercise,
        exercises: sortedExercises,
      };
      setComponent({
        ...component,
        supersets: supersetsCopy.map((superset) =>
          superset === supersetWithExercise ? newSuprset : superset
        ),
      });
      setTraining({
        ...training,
        components: training.components.map((c) =>
          c.id === component.id ? { ...c, supersets: supersetsCopy } : c
        ),
      });
      setSupersetsWithAdd(
        supersets.map((s) => (s === supersetWithExercise ? newSuprset : s))
      );
      return;
    }

    if (supersetWithNewExercise.exercises.length >= 4)
      return toast.error('You can only have 4 exercises per superset');

    const exerciseIndex = supersetWithExercise.exercises.findIndex(
      (e) => e.id === draggableId
    );

    if (exerciseIndex === undefined || exerciseIndex === -1) return;

    supersetWithNewExercise.exercises.push(
      supersetWithExercise.exercises[exerciseIndex]
    );
    const newExercises = supersetWithNewExercise.exercises;
    const sortedExercises = newExercises
      .map((e) => ({
        exercise: e,
        y:
          document.getElementById(e.id)?.getBoundingClientRect().top ??
          Infinity, // Default to Infinity if not found
      }))
      .sort((a, b) => a.y - b.y) // Sort by y coordinate
      .map((item) => item.exercise); // Extract only exercises
    supersetWithNewExercise.exercises = sortedExercises;
    const oldFinalSuperset = supersetWithExercise.exercises.filter(
      (e) => e.id !== draggableId
    );

    const finalSupersetsCopy = supersetsCopy.map((superset) =>
      superset === supersetWithExercise
        ? { ...superset, exercises: oldFinalSuperset }
        : superset
    );
    setComponent({ ...component, supersets: finalSupersetsCopy });
    setTraining({
      ...training,
      components: training.components.map((c) =>
        c.id === component.id ? { ...c, supersets: finalSupersetsCopy } : c
      ),
    });
    setSupersetsWithAdd(finalSupersetsCopy);
  }

  const handleDeleteExercise = (exerciseId: string) => {
    if (!component || !training) return;
    const updatedSupersets = supersetsWithAdd.map((superset) => ({
      ...superset,
      exercises: superset.exercises.filter((e) => e.id !== exerciseId),
    }));

    const newComponent = {
      ...component,
      supersets: updatedSupersets,
    };
    setComponent(newComponent);
    setTraining({
      ...training,
      components: training.components.map((c) =>
        c.id === component.id ? newComponent : c
      ),
    });
    setSupersetsWithAdd(updatedSupersets);
  };

  const handleDeleteSuperset = (index: number) => {
    if (!component || !training) return;
    const updatedSupersets = supersetsWithAdd.filter((_, i) => i !== index);
    const newComponent = {
      ...component,
      supersets: updatedSupersets,
    };
    setComponent(newComponent);
    setTraining({
      ...training,
      components: training.components.map((c) =>
        c.id === component.id ? newComponent : c
      ),
    });
    setSupersetsWithAdd(updatedSupersets);
  };

  if (!component || !training) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center">
        {supersetsWithAdd.map((superset, i) => (
          <Droppable
            key={`${component.id}-${i}`}
            droppableId={`${component.id}-${i}`}
            direction="vertical"
          >
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                flexBasis={{
                  xs: '100%',
                  sm: '48%', // Two per row on small screens
                  md: '48%', // Three per row on medium screens
                  lg: '23%', // Four per row on large screens
                }}
                minWidth="250px" // Prevent excessive shrinking
                p={screenSize.isLaptop ? 0 : 2}
                display="flex"
                flexDirection="column"
              >
                <Box
                  onClick={() => handleDeleteSuperset(i)}
                  sx={{ cursor: 'pointer' }}
                >
                  <BorderColor color={superset.color || COLOR[i]} />
                </Box>

                <Box>
                  {superset.exercises.map((exercise, k) => (
                    <Draggable
                      key={exercise.id}
                      draggableId={exercise.id.toString()}
                      index={k}
                    >
                      {(provided, snapshot) => (
                        <Box
                          id={exercise.id}
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
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteExercise(exercise.id)
                                }
                              >
                                <DeleteIcon />
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

                <Box
                  onClick={() => handleDeleteSuperset(i)}
                  sx={{ cursor: 'pointer' }}
                >
                  <BorderColor
                    color={superset.color || COLOR[i]}
                    lower
                    applyMargin={superset.exercises.length === 0}
                  />
                </Box>
              </Box>
            )}
          </Droppable>
        ))}

        {supersetsWithAdd.length < 4 && (
          <Droppable
            key="addSupersetDroppable"
            droppableId="addSupersetDroppable"
            direction="vertical"
          >
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                display="flex"
                flexBasis={{
                  xs: '100%',
                  sm: '48%',
                  md: '32%',
                  lg: '24%',
                }}
                minWidth="250px"
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
            )}
          </Droppable>
        )}
      </Box>

      {/* Component exercises modal */}
      <MyModal
        isOpen={openAddExerciseModal}
        setIsOpen={(open) => setOpenAddExerciseModal(open)}
        cancelText="Close"
        onCancel={() => {
          const oldExercises = selectedExercisesIds.filter((id) =>
            supersetsWithAdd
              .map((s) => s.exercises.map((e) => e.id))
              .flat()
              .includes(id)
          );
          setSelectedExercisesIds(oldExercises);
          setOpenAddExerciseModal(false);
        }}
        onConfirm={() => {
          //get only new exercises

          const exercisesIdsToAdd = selectedExercisesIds.filter(
            (id) =>
              !supersetsWithAdd
                .map((s) => s.exercises.map((e) => e.id))
                .flat()
                .includes(id)
          );

          const exercisesToAdd: TrainingExercise[] = exercisesIdsToAdd.map(
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

          for (const superset of supersets) {
            while (superset.exercises.length < 4 && exercisesToAdd.length > 0) {
              const exerciseToAdd = exercisesToAdd.shift(); // Remove from the front
              if (exerciseToAdd) superset.exercises.push(exerciseToAdd);
            }
            if (exercisesToAdd.length === 0) break; // Stop if no exercises left
          }

          if (exercisesToAdd.length > 0) {
            toast.error(
              'Added exercises exceed the maximum number of exercises allowed'
            );
            return;
          }
          setSupersetsWithAdd([...supersets]);

          const updatedComponents = [...training.components];
          updatedComponents[trainingComponentIndex] = {
            ...updatedComponents[trainingComponentIndex],
            supersets: [...supersets],
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
