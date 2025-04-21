import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { Box, Grid2, IconButton, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { TrainingExerciseCardProps } from './props';
import { useScreenSize } from '@/context/screen-size-provider';
import { Circle } from '@mui/icons-material';
import { ExerciseParam } from './exercise-card/exercise-param';
import {
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import { useGroup } from '@/context/group-provider';
import ReactDOM from 'react-dom';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const {
    supersetIndex,
    setSelectedExercise,
    chartView,
    setOpenVideoPlayerModal,
    supersets,
    setSupersetsWithAdd,
  } = props;

  const [exercise, setExercise] = useState(props.exercise);
  const [expandedSetsView, setExpandedSetsView] = useState(false);
  const {
    training,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    setComponent,
    setTraining,
  } = useTrainerDayViewContext();

  const { filteredTrainings, setFilteredTrainings, setDetectedChanges } =
    useGroup();

  const i = training?.components.findIndex((c) => c.id === component?.id);
  const selectedTrainingOrSubgroup =
    selectedSubgroup?.subgroup || training?.components?.[i!];
  const k = selectedTrainingOrSubgroup?.supersets?.[
    supersetIndex!
  ]?.exercises?.findIndex((e) => e.id === exercise.id);

  const currentExercise =
    selectedTrainingOrSubgroup?.supersets?.[supersetIndex!]?.exercises?.[k!];

  const params =
    currentExercise?.sets?.[0]?.paramValues
      ?.map((pv) => exercise?.params?.find((p) => p.field === pv.field)!)
      ?.filter((p) => p) || [];

  const [noOfSets, setNoOfSets] = useState(
    currentExercise?.sets.length ||
      params.find((p) => p.field === 'volWorkSets')?.defaultValue ||
      3
  );

  if (!training || !component || !params) return null;

  useEffect(() => updateTraining(), [exercise]);

  function updateTraining() {
    const newSuperset = { ...supersets[supersetIndex] };
    const exerciseIndex = newSuperset.exercises.findIndex(
      (e) => e.id === exercise.id
    );

    if (exerciseIndex === -1 || !training || !component) return;

    newSuperset.exercises[exerciseIndex] = { ...exercise };
    const newSupersets = [...supersets];
    if (supersetIndex !== -1) newSupersets[supersetIndex] = newSuperset;

    let updatedComponent = {
      ...component,
      supersets: newSupersets,
    };

    if (selectedSubgroup?.subgroup) {
      const updatedSubgroup = {
        ...selectedSubgroup.subgroup,
        supersets: newSupersets,
      };

      updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s, i) =>
          i === selectedSubgroup.index ? updatedSubgroup : s
        ),
      };
    }

    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };

    ReactDOM.unstable_batchedUpdates(() => {
      setSupersetsWithAdd(newSupersets);
      if (selectedSubgroup?.subgroup)
        setSelectedSubgroup({
          index: selectedSubgroup.index,
          subgroup: {
            ...selectedSubgroup.subgroup,
            supersets: newSupersets,
          },
        });

      setComponent(updatedComponent);
      setTraining(newTraining);
      setFilteredTrainings(
        [...filteredTrainings].map((filtered) =>
          filtered.id === training.id ? newTraining : filtered
        )
      );

      setDetectedChanges(true);
    });
  }

  return (
    <Stack
      spacing={1}
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={2}
      sx={{
        width: '100% !important',
        my: -1,
        position: 'relative',
        backgroundColor: chartView
          ? 'transparent'
          : exercise.exercise?.imageUrl
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.05)',
        backgroundImage: exercise.exercise?.imageUrl
          ? `url(${exercise.exercise?.imageUrl})`
          : undefined,
        backgroundPosition: 'center',
        backgroundSize: '100% auto',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {/* Background Overlay */}
      <Box
        sx={{
          width: '100% !important',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(38, 54, 70, 0.825)',
          zIndex: 0,
          opacity: 100,
        }}
      />
      <Stack
        direction="row"
        justifyContent="center"
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          setSelectedExercise(exercise);
          setOpenVideoPlayerModal(true);
        }}
      >
        <Tooltip title={exercise.exercise?.name} placement="top">
          <Typography
            variant="body1"
            fontWeight="bold"
            fontSize={14}
            textTransform="uppercase"
            sx={{
              textAlign: 'center',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '75%',
              zIndex: 1,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {exercise.exercise?.name}
          </Typography>
        </Tooltip>
      </Stack>

      {!expandedSetsView ? (
        <Grid2
          container
          spacing={1}
          columns={11}
          key={i}
          px={screenSize.isSmallerThanLaptop ? 1 : 0}
        >
          <Grid2 size={1}>
            <IconButton
              disableRipple
              sx={{
                p: 0,
                m: 0,
                mt: 1.66,
                height: '100%',
                display: i === 0 ? undefined : 'none',
              }}
              onClick={() => setExpandedSetsView(!expandedSetsView)}
            >
              <Circle
                sx={{
                  color: 'white !important',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                }}
              />
            </IconButton>
          </Grid2>

          <Grid2 size={10}>
            <Box
              display="flex"
              width="100%"
              justifyContent="center"
              alignItems="center"
              gap={1}
            >
              {exercise.params.map((param) => {
                const value = exercise.sets[0].paramValues.find(
                  (pv) => pv.field === param.field
                ) || {
                  field: param.field,
                  selected: 'set',
                  value: noOfSets.toString(),
                };

                return (
                  <Box
                    key={param.field}
                    flexBasis={(100 / exercise.params.length).toString() + '%'}
                  >
                    <ExerciseParam
                      param={param}
                      value={value}
                      onOptionChange={(newValue) => {
                        const paramIndex =
                          exercise.sets[0].paramValues.findIndex(
                            (pv) => pv.field === param.field
                          );

                        const newExercise = { ...exercise };
                        newExercise.sets.forEach(({ paramValues }) => {
                          if (paramValues[paramIndex])
                            paramValues[paramIndex].selected =
                              newValue as string;
                        });

                        setExercise(newExercise);
                      }}
                      onSubOptionChange={(newValue) => {
                        if (+newValue < 0) return;

                        if (param.field === 'volWorkSets') {
                          const newSets = +newValue;
                          if (newSets > 16) return;

                          setNoOfSets(newSets);
                          setExercise((prev) => {
                            const prevSets = prev.sets.length;
                            if (prevSets > newSets)
                              // remove sets
                              return {
                                ...prev,
                                sets: prev.sets.slice(0, newSets),
                                params: [...prev.params],
                              };

                            // add sets to the end
                            return {
                              ...prev,
                              sets: [
                                ...prev.sets,
                                ...Array.from(
                                  { length: newSets - prevSets },
                                  (_, i) => {
                                    // clone the paramValues from the last set
                                    return {
                                      setNumber: prevSets + i + 1,
                                      paramValues: prev.sets[
                                        prev.sets.length - 1
                                      ].paramValues.map((pv) => ({ ...pv })),
                                    };
                                  }
                                ),
                              ],
                            };
                          });

                          return;
                        }

                        const paramIndex =
                          exercise.sets[0].paramValues.findIndex(
                            (pv) => pv.field === param.field
                          );

                        const newExercise = { ...exercise };
                        newExercise.sets.forEach(({ paramValues }) => {
                          if (paramValues[paramIndex])
                            paramValues[paramIndex].value = newValue as string;
                        });

                        setExercise(newExercise);
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Grid2>
        </Grid2>
      ) : (
        <Box display="flex" flexDirection="column" width="100%">
          {exercise.sets.map((set, i) => {
            return (
              <Grid2
                container
                spacing={1}
                columns={11}
                key={i}
                px={screenSize.isSmallerThanLaptop ? 1 : 0}
              >
                <Grid2 size={1}>
                  <IconButton
                    disableRipple
                    sx={{
                      p: 0,
                      m: 0,
                      mt: 1.66,
                      height: '100%',
                      display: i === 0 ? undefined : 'none',
                    }}
                    onClick={() => {
                      setExpandedSetsView(!expandedSetsView);
                    }}
                  >
                    <Circle
                      sx={{
                        color: 'white !important',
                        fontSize: screenSize.isTablet ? 14 : 16,
                        ml: screenSize.isUltraSmall
                          ? 0
                          : screenSize.isMobile
                            ? 1
                            : 0,
                      }}
                    />
                  </IconButton>
                </Grid2>

                <Grid2 size={10}>
                  <Box
                    display="flex"
                    width="100%"
                    justifyContent="center"
                    alignItems="center"
                    gap={1}
                  >
                    {exercise.params.map((param, i) => {
                      const value = set.paramValues.find(
                        (pv) => pv.field === param.field
                      ) || {
                        field: param.field,
                        selected: 'set',
                        value: noOfSets.toString(),
                      };

                      return (
                        <Box
                          key={param.field}
                          flexBasis={
                            (100 / exercise.params.length).toString() + '%'
                          }
                        >
                          <ExerciseParam
                            showOptions={set.setNumber === 1}
                            disableOptions
                            disableSets
                            param={param}
                            value={value}
                            onOptionChange={(newValue) => {
                              const paramIndex = set.paramValues.findIndex(
                                (pv) => pv.field === param.field
                              );

                              const newExercise = { ...exercise };
                              newExercise.sets.forEach(({ paramValues }) => {
                                if (paramValues[paramIndex])
                                  paramValues[paramIndex].selected =
                                    newValue as string;
                              });

                              setExercise(newExercise);
                            }}
                            onSubOptionChange={(newValue) => {
                              if (+newValue < 0) return;

                              const paramIndex = set.paramValues.findIndex(
                                (pv) => pv.field === param.field
                              );

                              const newExercise = { ...exercise };
                              const setIndex = newExercise.sets.findIndex(
                                (s) => s.setNumber === set.setNumber
                              );

                              if (
                                newExercise.sets[setIndex].paramValues[
                                  paramIndex
                                ]
                              )
                                newExercise.sets[setIndex].paramValues[
                                  paramIndex
                                ].value = newValue as string;

                              setExercise(newExercise);
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Grid2>
              </Grid2>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
