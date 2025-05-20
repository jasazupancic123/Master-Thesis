import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { Box, Collapse, Grid2, IconButton, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useEffect, useState } from 'react';
import { TrainingExerciseCardProps } from './props';
import { useScreenSize } from '@/context/screen-size-provider';
import { Circle, Info } from '@mui/icons-material';
import { ExerciseParam } from './exercise-card/exercise-param';
import {
  ExerciseSet,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { useGroup } from '@/context/group-provider';
import ReactDOM from 'react-dom';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { IntensityVolumeValues } from '@/controller/training/type/intensity-volume-values.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { TrainingService } from '@/controller/training/training.service';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const {
    supersetIndex,
    selectedExercise,
    setSelectedExercise,
    chartView,
    setOpenVideoPlayerModal,
    supersets,
    setSupersetsWithAdd,
    exercise: propsExercise,
  } = props;

  const [exercise, setExercise] = useState(propsExercise);
  const [expandedSetsView, setExpandedSetsView] = useState(false);
  const [setsNumber, setSetsNumber] = useState(props.exercise.sets.length);
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

  if (!training || !component || !params) return null;

  useEffect(() => {
    if (propsExercise !== exercise) {
      setSetsNumber(propsExercise.sets.length);
      setExercise(propsExercise);
    }
  }, [propsExercise]);

  useEffect(() => {
    const newSets = setsNumber;
    if (newSets > 16 || newSets < 1) return;

    const prevSets = exercise.sets.length;

    let newExercise;
    if (prevSets > newSets) {
      // remove sets
      newExercise = {
        ...exercise,
        sets: [...exercise.sets].slice(0, newSets),
        params: [...exercise.params],
      };
    } else {
      // add sets to the end
      newExercise = {
        ...exercise,
        sets: [
          ...exercise.sets,
          ...Array.from({ length: newSets - prevSets }, (_, i) => ({
            setNumber: prevSets + i + 1,
            paramValues: exercise.sets[
              exercise.sets.length - 1
            ].paramValues.map((pv) => ({ ...pv })),
          })),
        ],
      };
    }

    updateTraining(newExercise);
  }, [setsNumber]);

  function updateTraining(
    exercise: TrainingExercise,
    intensityVolumeValue?: IntensityVolumeValues
  ) {
    if (!training || !component) return;

    const newSuperset = { ...supersets[supersetIndex] };
    const exerciseIndex = newSuperset.exercises.findIndex(
      (e) => e.id === exercise.id
    );

    if (exerciseIndex === -1 || !training || !component) return;

    newSuperset.exercises[exerciseIndex] = { ...exercise };
    const newSupersets = [...supersets];
    if (supersetIndex !== -1) newSupersets[supersetIndex] = newSuperset;

    ReactDOM.unstable_batchedUpdates(() => {
      setSupersetsWithAdd(newSupersets);

      if (selectedSubgroup?.subgroup) {
        // set new avg future workload values
        let newAvgFutureWorkloadValues = undefined;
        if (intensityVolumeValue) {
          newAvgFutureWorkloadValues = [
            ...selectedSubgroup.subgroup.avgFutureWorkloadValues,
          ];
          const foundAvgWorkloadValue = newAvgFutureWorkloadValues.find(
            (aw) => aw.exerciseId === exercise.id
          );
          if (!foundAvgWorkloadValue) {
            newAvgFutureWorkloadValues.push({
              exerciseId: exercise.id,
              rootComponentId: component.component?.id || '',
              numMembers: selectedSubgroup.subgroup.membersIds.length,
              avgWorkloadValue: intensityVolumeValue!,
            });
          } else {
            foundAvgWorkloadValue.numMembers =
              selectedSubgroup.subgroup.membersIds.length;
            foundAvgWorkloadValue.avgWorkloadValue = intensityVolumeValue!;
          }
        }

        const updatedSubgroup = newAvgFutureWorkloadValues
          ? {
              ...selectedSubgroup.subgroup,
              supersets: newSupersets,
              avgFutureWorkloadValues: newAvgFutureWorkloadValues,
            }
          : {
              ...selectedSubgroup.subgroup,
              supersets: newSupersets,
            };

        const updatedComponent = {
          ...component,
          subgroups: component.subgroups.map((s, i) =>
            i === selectedSubgroup.index ? updatedSubgroup : s
          ),
        };
        setSelectedSubgroup({
          subgroup: updatedSubgroup,
          index: selectedSubgroup.index,
        });

        setComponent(updatedComponent);
        const updatedComponents = [...training.components].map((c) =>
          c.id === component.id ? updatedComponent : c
        );

        const newTraining = { ...training, components: updatedComponents };
        setTraining(newTraining);

        const updatedTrainings = [...filteredTrainings].map(
          (filteredTraining) => {
            if (filteredTraining.id === training.id) {
              return newTraining;
            }
            return filteredTraining;
          }
        );

        setFilteredTrainings(updatedTrainings);
      } else {
        const updatedComponent = {
          ...component,
          supersets: newSupersets,
        };

        setDetectedChanges(true);

        setComponent(updatedComponent);
        const updatedComponents = [...training.components].map((c) =>
          c.id === component.id ? updatedComponent : c
        );

        // set new avg future workload values
        let newAvgFutureWorkloadValues = undefined;
        if (intensityVolumeValue) {
          newAvgFutureWorkloadValues = [...training.avgFutureWorkloadValues];
          const foundAvgWorkloadValue = newAvgFutureWorkloadValues.find(
            (aw) => aw.exerciseId === exercise.id
          );

          // get number of members in main group
          const subgroupsMembersIds = updatedComponent.subgroups.reduce(
            (acc, subgroup) => {
              return [...acc, ...subgroup.membersIds];
            },
            [] as string[]
          );
          const numberOfMainGroupMembers =
            training.membersIds.length - subgroupsMembersIds.length;

          if (!foundAvgWorkloadValue) {
            newAvgFutureWorkloadValues.push({
              exerciseId: exercise.id,
              rootComponentId: component.component?.id || '',
              numMembers: numberOfMainGroupMembers,
              avgWorkloadValue: intensityVolumeValue!,
            });
          } else {
            foundAvgWorkloadValue.numMembers = numberOfMainGroupMembers;
            foundAvgWorkloadValue.avgWorkloadValue = intensityVolumeValue!;
          }
        }

        const newTraining = newAvgFutureWorkloadValues
          ? {
              ...training,
              components: updatedComponents,
              avgFutureWorkloadValues: newAvgFutureWorkloadValues,
            }
          : { ...training, components: updatedComponents };
        setTraining(newTraining);

        const updatedTrainings = filteredTrainings.map((filteredTraining) => {
          if (filteredTraining.id === training.id) {
            return newTraining;
          }
          return filteredTraining;
        });

        setFilteredTrainings(updatedTrainings);
      }

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
        position: 'relative',
        backgroundColor: chartView
          ? 'transparent'
          : exercise.exercise?.imageUrl
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.05)',
        backgroundImage:
          exercise.exercise?.imageUrl && !expandedSetsView
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

      {chartView ? (
        <></>
      ) : !expandedSetsView ? (
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
                // mt: 1.66,
                pb: 3.66,
                height: '100%',
              }}
              onClick={() => setExpandedSetsView(!expandedSetsView)}
            >
              {/* <Circle
                sx={{
                  display:
                    selectedExercise?.id === exercise.id ? 'none' : undefined,
                  color: 'white !important',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                }}
              /> */}
                <KeyboardArrowRightIcon
                sx={{
                  transform: expandedSetsView ? 'rotate(90deg)' : 'rotate(0deg)',
                  color: 'white',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                  transition: 'transform 0.3s ease-in-out',
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
                  value: exercise.sets.length.toString(),
                };

                return (
                  <Box
                    key={param.field}
                    flexBasis={(100 / exercise.params.length).toString() + '%'}
                  >
                    <ExerciseParam
                      param={param}
                      value={
                        param.field === 'volWorkSets'
                          ? ({
                              field: value.field,
                              selected: value.selected,
                              value: setsNumber.toString(),
                            } as AttributeValue)
                          : value
                      }
                      exercise={exercise}
                      setsNumber={setsNumber}
                      setSetsNumber={setSetsNumber}
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
                          setSetsNumber(+newValue);
                          return;
                          /*
                          const newSets = +newValue;
                          if (newSets > 16 || newSets < 1) return;

                          const prevSets = exercise.sets.length;

                          let newExercise;
                          if (prevSets > newSets) {
                            // remove sets
                            newExercise = {
                              ...exercise,
                              sets: [...exercise.sets].slice(0, newSets),
                              params: [...exercise.params],
                            };
                          } else {
                            // add sets to the end
                            newExercise = {
                              ...exercise,
                              sets: [
                                ...exercise.sets,
                                ...Array.from(
                                  { length: newSets - prevSets },
                                  (_, i) => ({
                                    setNumber: prevSets + i + 1,
                                    paramValues: exercise.sets[
                                      exercise.sets.length - 1
                                    ].paramValues.map((pv) => ({ ...pv })),
                                  })
                                ),
                              ],
                            };
                          }

                          updateTraining(newExercise);
                          return;
                          */
                        }

                        const paramIndex =
                          exercise.sets[0].paramValues.findIndex(
                            (pv) => pv.field === param.field
                          );

                        const newExercise = { ...exercise };

                        const updatedSets: ExerciseSet[] = newExercise.sets.map(
                          (set) => {
                            return {
                              setNumber: set.setNumber,
                              paramValues: [...set.paramValues].map(
                                (param, index) => {
                                  if (index === paramIndex) {
                                    return {
                                      field: param.field,
                                      selected: param.selected,
                                      value: newValue as string,
                                    } as AttributeValue;
                                  }
                                  return {
                                    field: param.field,
                                    selected: param.selected,
                                    value: param.value,
                                  } as AttributeValue;
                                }
                              ),
                            };
                          }
                        );

                        const intensityVolumeValue =
                          TrainingService.getIntensityVolumeValues(updatedSets);

                        newExercise.sets = [...updatedSets];
                        updateTraining(newExercise, intensityVolumeValue);
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Grid2>
        </Grid2>
      ) : (
        <Box display="flex" flexDirection="column" width="100%" gap={1}>
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
                      // mt: 1.66,
                      pb: 3.66,
                      height: '100%',
                      display: i === 0 ? undefined : 'none',
                    }}
                    onClick={() => {
                      setExpandedSetsView(!expandedSetsView);
                    }}
                  >
                    <KeyboardArrowRightIcon
                sx={{
                  transform: expandedSetsView ? 'rotate(90deg)' : 'rotate(0deg)',
                  color: 'white',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                  transition: 'transform 0.3s ease-in-out',
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
                    {exercise.params.map((param, j) => {
                      const value = set.paramValues.find(
                        (pv) => pv.field === param.field
                      ) || {
                        field: param.field,
                        selected: 'set',
                        value: (i + 1).toString(),
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
                            onOptionChange={(newValue) => {}}
                            onSubOptionChange={(newValue) => {
                              if (+newValue < 0) return;

                              const paramIndex =
                                exercise.sets[0].paramValues.findIndex(
                                  (pv) => pv.field === param.field
                                );

                              const newExercise = { ...exercise };

                              const setIndex = newExercise.sets.findIndex(
                                (s) => s.setNumber === set.setNumber
                              );

                              const updatedSets: ExerciseSet[] =
                                newExercise.sets.map((set, i) => {
                                  return {
                                    setNumber: set.setNumber,
                                    paramValues: [...set.paramValues].map(
                                      (param, index) => {
                                        if (
                                          index === paramIndex &&
                                          setIndex === i
                                        ) {
                                          return {
                                            field: param.field,
                                            selected: param.selected,
                                            value: newValue as string,
                                          } as AttributeValue;
                                        }
                                        return {
                                          field: param.field,
                                          selected: param.selected,
                                          value: param.value,
                                        } as AttributeValue;
                                      }
                                    ),
                                  };
                                });

                              const intensitySum = updatedSets.reduce(
                                (sum, set) => {
                                  const intensityValue = set.paramValues.find(
                                    (pv) => pv.field === 'int1'
                                  )?.value;
                                  return (
                                    sum + (intensityValue ? +intensityValue : 0)
                                  );
                                },
                                0
                              );

                              const intensityVolumeValue =
                                TrainingService.getIntensityVolumeValues(
                                  updatedSets
                                );

                              newExercise.sets = [...updatedSets];
                              updateTraining(newExercise, intensityVolumeValue);
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
