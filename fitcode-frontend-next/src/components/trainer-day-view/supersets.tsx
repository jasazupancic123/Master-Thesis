'use client';

import { COLOR } from '@/common/constant/browser.constant';
import BorderColor from '@/components/border-color';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import {
  ExerciseSet,
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Grid2,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import MyModal from '../modal';
import AddExerciseForm from './add-exercise-form';
import { NUM_MAX_EXERCISES_PER_SUPERSET, NUM_MAX_SUPERSETS } from './constant';
import { SupersetsProps } from './props';
import { handleDeleteExercise, handleDeleteSuperset, onDragEnd } from './state';
import TrainingExerciseCardContainer from './training-exercise-card-container';
import { useTheme } from '@mui/material';
import {
  ArrowDropDown,
  ArrowDropUp,
  MoreVert,
  Timeline,
} from '@mui/icons-material';
import { Attribute } from '@tensorflow/tfjs';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ComponentParam } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { idID } from '@mui/material/locale';

export default function Supersets(props: SupersetsProps) {
  const { openAddExerciseModal, setOpenAddExerciseModal } = props;
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    exercises: allExercises,
    filteredTrainings,
    setFilteredTrainings,
    setDetectedChanges,
  } = useGroup();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    setSearch,
  } = useTrainerDayViewContext();

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

  const [openVideoPlayerModal, setOpenVideoPlayerModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [menuExercise, setMenuExercise] = useState<TrainingExercise | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openPeriodize, setOpenPeriodize] = useState(false);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOpenPeriodize(false);
    setMenuExercise(null);
  };

  const handeleTogglePeriodize = () => {
    setOpenPeriodize(!openPeriodize);
  };

  const handlePeriodizeSelect = (
    exercise: TrainingExercise,
    periodizeType: 'linear' | 'undulating' | 'block'
  ) => {
    handleMenuClose();
  };

  useEffect(() => {
    setSelectedExercisesIds(
      supersets && supersets.length
        ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
        : []
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (supersetsWithAdd.length > 0) {
      setInitialized(true);
    }
  }, [supersetsWithAdd]);

  useEffect(() => {
    if (selectedSubgroup?.subgroup?.supersets) {
      setSupersetsWithAdd(selectedSubgroup.subgroup.supersets);
    } else {
      if (!component) setSelectedExercisesIds([]);
      else if (component.supersets) setSupersetsWithAdd(component.supersets);
    }
  }, [component, selectedSubgroup]);

  useEffect(() => {}, [selectedExercise]);

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
                  superset.exercises.some((e) => e.id === selectedExercise.id)
                    ? 12
                    : screenSize.isLandscapeMobile
                      ? 4
                      : 6,
                md:
                  selectedExercise &&
                  superset.exercises.some((e) => e.id === selectedExercise.id)
                    ? screenSize.isLandscapeMobile
                      ? 4
                      : 6
                    : screenSize.isLandscapeMobile
                      ? 4
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
                    p={
                      screenSize.isLaptop || screenSize.isMobile
                        ? 0
                        : screenSize.isLandscapeMobile
                          ? 0.5
                          : 2
                    }
                    pt={0}
                  >
                    <Box
                      sx={{
                        cursor: 'pointer',
                        px: screenSize.isLaptop ? 0.5 : 0,
                      }}
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
                        applyMargin
                        marginValue={
                          superset.exercises.length === 0 ? '3px' : '5px'
                        }
                      />
                    </Box>

                    <Grid2 container>
                      {supersetsWithAdd.length === 1 &&
                      superset.exercises.length === 0 ? (
                        <Box
                          border="1px dashed #B2B3B7"
                          borderRadius={2}
                          sx={{ cursor: 'pointer' }}
                          p={1}
                          py={3}
                          width="100%"
                          height="100%"
                          textAlign="center"
                          onClick={() => setOpenAddExerciseModal(true)}
                        >
                          <Typography variant="body2" align="center">
                            Add exercise
                          </Typography>
                        </Box>
                      ) : (
                        superset.exercises.map((exercise, k) => (
                          <Grid2
                            size={{ xs: 12 }}
                            key={exercise.id}
                            sx={{
                              mb:
                                superset.exercises.length - 1 !== k
                                  ? 0.4
                                  : undefined,
                            }}
                          >
                            <Draggable
                              key={exercise.id}
                              draggableId={exercise.id.toString()}
                              index={k}
                              isDragDisabled={
                                !!(selectedExercise?.id === exercise.id)
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
                                  px={screenSize.isLaptop ? 0.5 : 0}
                                  py={
                                    selectedExercise?.id === exercise.id
                                      ? 0
                                      : undefined
                                  }
                                  borderRadius={1}
                                  boxShadow={
                                    snapshot.isDragging && !open ? 2 : 0
                                  }
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
                                    onClick={() => {
                                      setSelectedExercise(exercise);
                                    }}
                                    sx={{
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color={theme.palette.background.dark}
                                      sx={{ zIndex: 1 }}
                                    >
                                      {`${i + 1}${String.fromCharCode(65 + k)}`}
                                    </Typography>
                                  </Box>
                                  <Box
                                    position="absolute"
                                    top={5}
                                    right={
                                      screenSize.isLandscapeMobile ? 0 : 10
                                    }
                                    display={
                                      selectedExercise?.id === exercise.id
                                        ? 'none'
                                        : 'flex'
                                    }
                                    flexDirection="column"
                                    zIndex={1}
                                  >
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        handleMenuClick(e);
                                        setMenuExercise(exercise); // Save the correct exercise here
                                      }}
                                    >
                                      <MoreVert
                                        sx={{
                                          width: 16,
                                          height: 16,
                                          transform: 'rotate(90deg)',
                                        }}
                                      />
                                    </IconButton>
                                    <Menu
                                      anchorEl={anchorEl}
                                      open={open}
                                      onClose={handleMenuClose}
                                      anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                      }}
                                      sx={{
                                        '& .MuiPaper-root': {
                                          boxShadow:
                                            '10px 10px 10px rgba(0, 0, 0, 0.1)', // Disables shadow for the Menu's Paper component
                                        },
                                      }}
                                      transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                      }}
                                    >
                                      <MenuItem
                                        onClick={() => {
                                          if (!menuExercise) return;
                                          handleDeleteExercise(
                                            { exerciseId: menuExercise.id },
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
                                          );
                                          handleMenuClose();
                                        }}
                                        sx={{
                                          textAlign: 'center !important',
                                        }}
                                      >
                                        <Typography
                                          width="100%"
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                        >
                                          <DeleteIcon sx={{ mr: 0.5 }} />
                                          Delete
                                        </Typography>
                                      </MenuItem>
                                      <MenuItem
                                        onClick={handeleTogglePeriodize}
                                        sx={{
                                          width: '100%',
                                          position: 'relative',
                                          textAlign: 'center !important',
                                        }}
                                      >
                                        <Typography
                                          width="100%"
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                          sx={{ pr: 1 }}
                                        >
                                          <Timeline sx={{ marginRight: 1 }} />{' '}
                                          Periodize
                                        </Typography>
                                        {openPeriodize ? (
                                          <ArrowDropUp
                                            sx={{
                                              position: 'absolute',
                                              right: 0,
                                            }}
                                          />
                                        ) : (
                                          <ArrowDropDown
                                            sx={{
                                              position: 'absolute',
                                              right: 0,
                                            }}
                                          />
                                        )}
                                      </MenuItem>
                                      {openPeriodize && (
                                        <>
                                          <MenuItem
                                            onClick={() => {
                                              handlePeriodizeSelect(
                                                exercise,
                                                'linear'
                                              );
                                            }}
                                            sx={{
                                              textAlign: 'center !important',
                                            }}
                                          >
                                            <Typography width="100%">
                                              Linear
                                            </Typography>
                                          </MenuItem>
                                          <MenuItem
                                            onClick={() => {
                                              handlePeriodizeSelect(
                                                exercise,
                                                'undulating'
                                              );
                                            }}
                                            sx={{
                                              textAlign: 'center !important',
                                            }}
                                          >
                                            <Typography width="100%">
                                              Undulating
                                            </Typography>
                                          </MenuItem>
                                          <MenuItem
                                            onClick={() => {
                                              handlePeriodizeSelect(
                                                exercise,
                                                'block'
                                              );
                                            }}
                                            sx={{
                                              textAlign: 'center !important',
                                            }}
                                          >
                                            <Typography width="100%">
                                              Block
                                            </Typography>
                                          </MenuItem>
                                        </>
                                      )}
                                    </Menu>
                                  </Box>
                                  <TrainingExerciseCardContainer
                                    supersetIndex={i}
                                    exercise={exercise}
                                    selectedExercise={selectedExercise}
                                    setSelectedExercise={setSelectedExercise}
                                    supersets={supersetsWithAdd}
                                    setSupersetsWithAdd={setSupersetsWithAdd}
                                    superior={{
                                      row: i === 0,
                                      column: k === 0,
                                      all: i === 0 && k === 0,
                                    }}
                                    setOpenVideoPlayerModal={
                                      setOpenVideoPlayerModal
                                    }
                                  />
                                </Box>
                              )}
                            </Draggable>
                          </Grid2>
                        ))
                      )}

                      {provided.placeholder}
                    </Grid2>

                    <Box
                      sx={{
                        cursor: 'pointer',
                        px: screenSize.isLaptop ? 0.5 : 0,
                      }}
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
                        applyMargin
                        marginValue={
                          superset.exercises.length === 0 ? '3px' : '5px'
                        }
                      />
                    </Box>
                  </Stack>
                )}
              </Droppable>
            </Grid2>
          ))}

        {supersetsWithAdd.length < NUM_MAX_SUPERSETS && (
          <Grid2
            size={{ xs: 12, sm: screenSize.isLandscapeMobile ? 4 : 6, md: 3 }}
          >
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
                  onClick={() => setOpenAddExerciseModal(true)}
                >
                  <Typography variant="body2" align="center">
                    Drop here to add a new superset or click to add an exercise
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
          setSearch('');
        }}
        width={500}
        dialogueContentSx={{ px: screenSize.isMobile ? 0 : undefined }}
        onConfirm={() => {
          setSearch('');
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
            (id) => {
              const exercise = allExercises.find((e) => e.id === id);

              return {
                id,
                exercise: exercise,
                periodized: false,
                params: exercise?.defaultParams || [],
                sets: exercise?.defaultParams
                  ? Array.from({ length: 3 }, (_, i) => ({
                      setNumber: i + 1,
                      paramValues:
                        (exercise?.defaultParams &&
                          (exercise?.defaultParams
                            .map((p) => {
                              if (p.field === 'volWorkSets') return undefined;
                              return {
                                field: p.field,
                                selected: p.defaultValue,
                                value: p.options?.find(
                                  (o) => o.field === p.defaultValue
                                )?.options?.length
                                  ? '0' //picks the first element in the options array
                                  : p.options?.find(
                                      (o) => o.field === p.defaultValue
                                    )?.defaultValue,
                              } as AttributeValue;
                            })
                            .filter(
                              (p) => p !== undefined
                            ) as AttributeValue[])) ||
                        [],
                    }))
                  : [],
              };
            }
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
          if (supersets.length === 0)
            supersets.push({ exercises: [], color: COLOR[supersets.length] });

          for (const superset of supersets) {
            while (
              superset.exercises.length < NUM_MAX_EXERCISES_PER_SUPERSET &&
              exercisesToAdd.length > 0
            ) {
              const exerciseToAdd = exercisesToAdd.shift(); // remove from the front
              if (exerciseToAdd) superset.exercises.push({ ...exerciseToAdd });
            }

            if (exercisesToAdd.length === 0) break; // stop if no exercises left
          }

          // Keep creating new supersets until all exercises are added
          while (exercisesToAdd.length > 0) {
            if (supersets.length === NUM_MAX_SUPERSETS) {
              return toast.error(
                'Added exercises exceed the maximum number of exercises allowed'
              );
            }

            const newSuperset: Superset = {
              exercises: [],
              color: COLOR[supersets.length],
            };

            while (
              newSuperset.exercises.length < NUM_MAX_EXERCISES_PER_SUPERSET &&
              exercisesToAdd.length > 0
            ) {
              const exerciseToAdd = exercisesToAdd.shift();
              if (exerciseToAdd)
                newSuperset.exercises.push({ ...exerciseToAdd });
            }

            supersets.push(newSuperset);
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
            const newTraining = { ...training, components: updatedComponents };
            setTraining(newTraining);
            const newFilteredTrainings = [...filteredTrainings].map((t) =>
              t.id === newTraining.id ? newTraining : t
            );
            setFilteredTrainings(newFilteredTrainings);
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
            setOpenAddExerciseModal(false);
            setComponent({ ...component, subgroups: updatedSubgroups });
            setTraining({ ...training, components: updatedComponents });
            setSelectedSubgroup({
              index: selectedSubgroup.index,
              subgroup: updatedSubgroup,
            });
          }
        }}
      >
        <AddExerciseForm
          selectedExercisesIds={selectedExercisesIds}
          setSelectedExercisesIds={setSelectedExercisesIds}
          component={component}
        />
      </MyModal>
      <MyModal
        isOpen={openVideoPlayerModal}
        setIsOpen={(open) => setOpenVideoPlayerModal(open)}
        cancelText="Close"
        onCancel={() => {
          setSelectedExercise(null);
          setOpenVideoPlayerModal(false);
        }}
      >
        {selectedExercise?.exercise?.videoUrl ? (
          <Box
            component="video"
            src={selectedExercise?.exercise?.videoUrl}
            controls
            sx={{
              width: '100%', // Make it responsive
              maxWidth: 600, // Limit max width
              borderRadius: 2, // Optional rounded corners
              boxShadow: 3, // Optional shadow
            }}
          />
        ) : (
          <Typography variant="body2">No video available</Typography>
        )}
      </MyModal>
    </DragDropContext>
  );
}
