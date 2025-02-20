'use client';

import { COLOR } from '@/common/constant/browser.constant';
import { SetState } from '@/common/type/state.type';
import BorderColor from '@/components/border-color';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { SetType } from '@/controller/training/enum/set-type.enum';
import { WorkloadType } from '@/controller/training/enum/workload-type.enum';
import {
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import MyModal from '../modal';
import AddExerciseForm from './add-exercise-form';
import { SupersetsProps } from './props';
import { handleDeleteExercise, handleDeleteSuperset, onDragEnd } from './state';
import TrainingExerciseCard from './training-exercise-card';

export default function Supersets(props: SupersetsProps) {
  const { openAddExerciseModal, setOpenAddExerciseModal } = props;
  const screenSize = useScreenSize();
  const {
    training,
    setTraining,
    component,
    setComponent,
    exercises: allExercises,
    selectedSubgroup,
    setSelectedSubgroup,
    filteredTrainings,
    setFilteredTrainings,
    filter,
    setFilter,
  } = useGroup();

  const supersets =
    selectedSubgroup?.subgroup?.supersets || component?.supersets || [];
  const [supersetsWithAdd, setSupersetsWithAdd] = useState(supersets);
  const [selectedExercisesIds, setSelectedExercisesIds] = useState(
    supersets && supersets.length
      ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
      : []
  );

  useEffect(() => {
    console.log('Supersets Mounted');
  }, []);

  console.log('Supersets Context:', useGroup());

  useEffect(() => {
    console.log('Supersets: filter changed to', filter);
    setSupersetsWithAdd([]); // Reset state when changing views
  }, [filter]);

  useEffect(() => {
    setSelectedExercisesIds(
      supersets && supersets.length
        ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
        : []
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (selectedSubgroup?.subgroup?.supersets) {
      setSupersetsWithAdd(selectedSubgroup.subgroup.supersets);
    } else {
      if (!component) {
        setSelectedExercisesIds([]);
      } else if (component.supersets) {
        setSupersetsWithAdd(component.supersets);
      }
    }
  }, [component, selectedSubgroup]);

  if (!component || !training) return null;

  return (
    <DragDropContext
      onDragEnd={(input) =>
        onDragEnd(input, {
          training,
          setTraining,
          component,
          setComponent,
          selectedSubgroup,
          setSelectedSubgroup,
          supersets,
          supersetsWithAdd,
          setSupersetsWithAdd,
          filteredTrainings,
          setFilteredTrainings,
        })
      }
    >
      <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center">
        {supersetsWithAdd && supersetsWithAdd.length ? (
          supersetsWithAdd.map((superset, i) => (
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
                    onClick={() =>
                      handleDeleteSuperset(
                        { index: i },
                        {
                          training,
                          setTraining,
                          component,
                          setComponent,
                          selectedSubgroup,
                          setSelectedSubgroup,
                          supersetsWithAdd,
                          setSupersetsWithAdd,
                          filteredTrainings,
                          setFilteredTrainings,
                        }
                      )
                    }
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
                              top={10}
                              left={10}
                              display="flex"
                              flexDirection="column"
                            >
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {`${i + 1}${String.fromCharCode(65 + k)}`}
                              </Typography>
                            </Box>
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
                                    handleDeleteExercise(
                                      { exerciseId: exercise.id },
                                      {
                                        training,
                                        setTraining,
                                        component,
                                        setComponent,
                                        selectedSubgroup,
                                        setSelectedSubgroup,
                                        supersetsWithAdd,
                                        setSupersetsWithAdd,
                                        filteredTrainings,
                                        setFilteredTrainings,
                                      }
                                    )
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
                    onClick={() =>
                      handleDeleteSuperset(
                        { index: i },
                        {
                          training,
                          setTraining,
                          component,
                          setComponent,
                          selectedSubgroup,
                          setSelectedSubgroup,
                          supersetsWithAdd,
                          setSupersetsWithAdd,
                          filteredTrainings,
                          setFilteredTrainings,
                        }
                      )
                    }
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
          ))
        ) : (
          <></>
        )}

        {supersetsWithAdd.length < 4 && supersetsWithAdd.length > 0 && (
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
          const exercisesIdsToAdd =
            supersetsWithAdd && supersetsWithAdd.length
              ? [...selectedExercisesIds].filter(
                  (id) =>
                    !supersetsWithAdd
                      .map((s) => s.exercises.map((e) => e.id))
                      .flat()
                      .includes(id)
                )
              : selectedExercisesIds;

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
          const trainingComponentIndex = [...training.components].findIndex(
            (c) => c.id === component.id
          );

          // last superset index
          let supersets = selectedSubgroup?.subgroup?.supersets
            ? [...selectedSubgroup.subgroup.supersets]
            : training.components[trainingComponentIndex]?.supersets
              ? [...training.components[trainingComponentIndex].supersets]
              : [];

          if (!Array.isArray(supersets)) supersets = [];

          if (supersets.length === 0) {
            supersets.push({ exercises: [], color: COLOR[supersets.length] });
          }

          const newSupersets = [...supersets];

          for (const superset of newSupersets) {
            while (superset.exercises.length < 4 && exercisesToAdd.length > 0) {
              const exerciseToAdd = exercisesToAdd.shift(); // Remove from the front
              if (exerciseToAdd) superset.exercises.push({ ...exerciseToAdd });
            }

            if (exercisesToAdd.length === 0) break; // Stop if no exercises left

            if (newSupersets.indexOf(superset) === newSupersets.length - 1) {
              if (newSupersets.length === 4)
                return toast.error(
                  'Added exercises exceed the maximum number of exercises allowed'
                );

              const newSuperset: Superset = {
                exercises: exercisesToAdd,
                color: COLOR[newSupersets.length],
              };

              newSupersets.push(newSuperset);
              break;
            }
          }

          const updatedComponents = [...training.components];
          if (!selectedSubgroup?.subgroup) {
            // update training component's supersets
            updatedComponents[trainingComponentIndex] = {
              ...updatedComponents[trainingComponentIndex],
              supersets: [...newSupersets],
            };

            //setSupersetsWithAdd([]);
            setTraining({ ...training, components: updatedComponents });
            setOpenAddExerciseModal(false);
          } else {
            // update subgroup's supersets
            const updatedSubgroup = {
              ...selectedSubgroup.subgroup,
              supersets: [...newSupersets],
            };

            const updatedSubgroups = [...component.subgroups];
            updatedSubgroups[selectedSubgroup.index] = updatedSubgroup;

            const updatedComponents = [...training.components];
            updatedComponents[trainingComponentIndex] = {
              ...updatedComponents[trainingComponentIndex],
              subgroups: updatedSubgroups,
            };

            setSelectedSubgroup({
              index: selectedSubgroup.index,
              subgroup: updatedSubgroup,
            });
            setComponent({ ...component, subgroups: updatedSubgroups });
            setTraining({ ...training, components: updatedComponents });
            setOpenAddExerciseModal(false);
          }
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
