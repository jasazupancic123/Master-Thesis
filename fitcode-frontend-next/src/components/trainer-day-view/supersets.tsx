'use client';

import { COLOR } from '@/common/constant/browser.constant';
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
import {
  Box,
  Grid2,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import MyModal from '../modal';
import AddExerciseForm from './add-exercise-form';
import { NUM_MAX_SUPERSETS } from './constant';
import { SupersetsProps } from './props';
import { handleDeleteExercise, handleDeleteSuperset, onDragEnd } from './state';
import TrainingExerciseCardContainer from './training-exercise-card-container';

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
    selectedAthlete,
    setDetectedChanges,
  } = useGroup();

  const supersets =
    selectedSubgroup?.subgroup?.supersets || component?.supersets || [];
  const [supersetsWithAdd, setSupersetsWithAdd] = useState(supersets);
  const [selectedExercisesIds, setSelectedExercisesIds] = useState(
    supersets && supersets.length
      ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
      : []
  );
  const [selectedExercise, setSelectedExercise] =
    useState<TrainingExercise | null>(null);

  useEffect(() => {
    setSelectedExercisesIds(
      supersets && supersets.length
        ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
        : []
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (!selectedAthlete) setSelectedExercise(null);
  }, [selectedAthlete]);

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

  if (!component || !training) {
    return null;
  }

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
          setDetectedChanges,
        })
      }
    >
      <Grid2 container rowSpacing={2}>
        {supersetsWithAdd &&
          supersetsWithAdd.length > 0 &&
          supersetsWithAdd.map((superset, i) => (
            <Grid2
              size={{
                xs: 12,
                sm:
                  selectedExercise &&
                  selectedAthlete &&
                  superset.exercises.some((e) => e.id === selectedExercise.id)
                    ? 12
                    : 6,
                md:
                  selectedExercise &&
                  selectedAthlete &&
                  superset.exercises.some((e) => e.id === selectedExercise.id)
                    ? 6
                    : 3,
              }}
              key={`${component.id}-${i}`}
            >
              <Droppable
                key={`${component.id}-${i}`}
                droppableId={`${component.id}-${i}`}
                direction="vertical"
              >
                {(provided) => (
                  <Stack
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    p={screenSize.isLaptop ? 0 : 2}
                  >
                    <Box
                      sx={{ cursor: 'pointer', px: 1 }}
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
                            setDetectedChanges,
                          }
                        )
                      }
                    >
                      <BorderColor color={COLOR[i % COLOR.length]} />
                    </Box>

                    <Grid2 container>
                      {superset.exercises.map((exercise, k) => (
                        <Grid2 size={{ xs: 12 }} key={exercise.id}>
                          <Draggable
                            key={exercise.id}
                            draggableId={exercise.id.toString()}
                            index={k}
                            isDragDisabled={
                              !!(
                                selectedAthlete && selectedExercise === exercise
                              )
                            } // Disable dragging
                          >
                            {(provided, snapshot) => (
                              <Box
                                id={exercise.id}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                position="relative"
                                p={1}
                                py={
                                  selectedAthlete &&
                                  selectedExercise === exercise
                                    ? 0
                                    : undefined
                                }
                                borderRadius={1}
                                boxShadow={snapshot.isDragging ? 2 : 0}
                                bgcolor={
                                  snapshot.isDragging
                                    ? '#f0f0f0'
                                    : 'transparent'
                                }
                              >
                                <Box
                                  position="absolute"
                                  top={10}
                                  left={10}
                                  display="flex"
                                  flexDirection="column"
                                >
                                  <Typography variant="caption" color="#6d7b87">
                                    {`${i + 1}${String.fromCharCode(65 + k)}`}
                                  </Typography>
                                </Box>

                                <Box
                                  position="absolute"
                                  top={5}
                                  right={10}
                                  display={
                                    selectedAthlete &&
                                    exercise === selectedExercise
                                      ? 'none'
                                      : 'flex'
                                  }
                                  flexDirection="column"
                                >
                                  <Tooltip
                                    title="Delete exercise"
                                    placement="left"
                                  >
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
                                            setDetectedChanges,
                                          }
                                        )
                                      }
                                    >
                                      <DeleteIcon
                                        sx={{ width: 16, height: 16 }}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                </Box>

                                <TrainingExerciseCardContainer
                                  supersetIndex={i}
                                  exercise={exercise}
                                  selectedExercise={selectedExercise}
                                  setSelectedExercise={setSelectedExercise}
                                />
                              </Box>
                            )}
                          </Draggable>
                        </Grid2>
                      ))}

                      {provided.placeholder}
                    </Grid2>

                    <Box
                      sx={{ cursor: 'pointer', px: 1 }}
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
                            setDetectedChanges,
                          }
                        )
                      }
                    >
                      <BorderColor
                        color={COLOR[i % COLOR.length]}
                        lower
                        applyMargin={superset.exercises.length === 0}
                      />
                    </Box>
                  </Stack>
                )}
              </Droppable>
            </Grid2>
          ))}

        {supersetsWithAdd.length < NUM_MAX_SUPERSETS && (
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Droppable
              key="addSupersetDroppable"
              droppableId="addSupersetDroppable"
              direction="vertical"
            >
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  border="1px dashed #B2B3B7"
                  borderRadius={2}
                  sx={{ cursor: 'pointer' }}
                  p={1}
                  mx={1}
                >
                  <Typography variant="body2" align="center">
                    Drop here to add a new superset
                  </Typography>
                </Box>
              )}
            </Droppable>
          </Grid2>
        )}
      </Grid2>

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
              exercise: allExercises.find((e) => e.id === id),
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
          for (const superset of supersets) {
            while (
              superset.exercises.length < NUM_MAX_SUPERSETS &&
              exercisesToAdd.length > 0
            ) {
              const exerciseToAdd = exercisesToAdd.shift(); // Remove from the front
              if (exerciseToAdd) superset.exercises.push({ ...exerciseToAdd });
            }

            if (exercisesToAdd.length === 0) break; // Stop if no exercises left

            if (supersets.indexOf(superset) === supersets.length - 1) {
              if (supersets.length === NUM_MAX_SUPERSETS)
                return toast.error(
                  'Added exercises exceed the maximum number of exercises allowed'
                );

              const newSuperset: Superset = {
                exercises: exercisesToAdd,
                color: COLOR[supersets.length],
              };

              supersets.push(newSuperset);
              break;
            }
          }

          const updatedComponents = [...training.components];
          if (!selectedSubgroup?.subgroup) {
            // update training component's supersets
            updatedComponents[trainingComponentIndex] = {
              ...updatedComponents[trainingComponentIndex],
              supersets: [...supersets],
            };

            const updatedComponent = {
              ...component,
              supersets: [...supersets],
            };

            setDetectedChanges(true);
            setSupersetsWithAdd([...supersets]);
            setComponent({ ...updatedComponent });
            setTraining({ ...training, components: updatedComponents });
            setOpenAddExerciseModal(false);
          } else {
            // update subgroup's supersets
            const updatedSubgroup = {
              ...selectedSubgroup.subgroup,
              supersets: [...supersets],
            };

            const updatedSubgroups = [...component.subgroups];
            updatedSubgroups[selectedSubgroup.index] = updatedSubgroup;

            const updatedComponents = [...training.components];
            updatedComponents[trainingComponentIndex] = {
              ...updatedComponents[trainingComponentIndex],
              subgroups: updatedSubgroups,
            };

            setDetectedChanges(true);
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
