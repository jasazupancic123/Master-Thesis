import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, Grid2, IconButton } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useScreenSize } from '@/store/screen-size-provider';
import { ExerciseParam } from '../exercise-param/exercise-param';
import {
  ExerciseSet,
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { useGroup } from '@/store/group-provider';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { TrainingService } from '@/controller/training/training.service';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import toast from 'react-hot-toast';
import {
  getLAndRValues,
  handleAthleteWorkloadsChange,
  updateTraining,
} from '../training-exercise-card/state';
import { SetState } from '@/common/type/state.type';

interface TrainingExerciseCarExpandedSetsProps {
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  supersets: Superset[];
  setSupersetsWithAdd: SetState<Superset[]>;
  supersetIndex: number;
}

export default function TrainingExerciseCardExpandedSets(
  props: TrainingExerciseCarExpandedSetsProps
) {
  const screenSize = useScreenSize();

  const {
    training,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    setComponent,
    setTraining,
    selectedAthlete,
    selectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
  } = useTrainerDayViewContext();

  const { filteredTrainings, setFilteredTrainings, setDetectedChanges } =
    useGroup();

  const {
    exercise,
    expandedSetsView,
    setExpandedSetsView,
    supersets,
    setSupersetsWithAdd,
    supersetIndex,
  } = props;

  if (!training || !component) return null;

  return (
    <Box display="flex" flexDirection="column" width="100%" gap={1}>
      {/* Expanded sets view */}
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
                    transform: expandedSetsView
                      ? 'rotate(90deg)'
                      : 'rotate(0deg)',
                    color: 'white',
                    fontSize: screenSize.isTablet ? 14 : 16,
                    ml: screenSize.isUltraSmall
                      ? 0
                      : screenSize.isMobile
                        ? 1
                        : 0,
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
                <Box
                  display="flex"
                  flexDirection="column"
                  gap={1}
                  justifyContent="end"
                  height={set.setNumber === 1 ? 80 : 55}
                >
                  <LeftRightExerciseText title="L" />
                  <LeftRightExerciseText title="R" />
                </Box>
                {exercise.params.map((param, j) => {
                  /* find the custom workload for the selected athlete if selected, otherwise
                      get the value from the exercise sets */
                  const { valueL, valueR } = getLAndRValues(
                    {
                      set,
                      param,
                      setIndex: i,
                      paramIndex: j - 1,
                    },
                    {
                      training,
                      exercise,
                      selectedAthleteWorkloads,
                      customAthleteWorkloads,
                      selectedAthlete,
                    }
                  );

                  if (!valueL || !valueR) {
                    toast.error(`Invalid parameter field: ${param.field}`);
                    return null;
                  }

                  let min, max;
                  const attributeRange = exercise.attributeRanges.find(
                    (ar) => ar.field === param.field
                  );
                  if (attributeRange) {
                    const foundInOptions = attributeRange.options?.find(
                      (option) => option.field === valueL.selected
                    );
                    if (foundInOptions) {
                      min = foundInOptions.min;
                      max = foundInOptions.max;
                    } else {
                      min = attributeRange.min;
                      max = attributeRange.max;
                    }
                  }

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
                        value={valueL}
                        onOptionChange={(newValue) => {}}
                        min={min}
                        max={max}
                        onSubOptionChange={(newValue) => {
                          if (+newValue < 0) return;

                          // update only selected athletes workloads
                          if (selectedAthlete) {
                            handleAthleteWorkloadsChange(
                              {
                                exercise,
                                setNumber: set.setNumber,
                                param,
                                newValue: newValue as string,
                                leftOrRight: 'L',
                              },
                              {
                                training,
                                selectedAthleteWorkloads,
                                setCustomAthleteWorkloads,
                                selectedAthlete,
                                customAthleteWorkloads,
                              }
                            );
                            return;
                          }

                          const paramIndex = exercise.sets[
                            i
                          ].paramValuesL.findIndex(
                            (pv) => pv.field === param.field
                          );

                          const newExercise = { ...exercise };

                          const setIndex = newExercise.sets.findIndex(
                            (s) => s.setNumber === set.setNumber
                          );

                          const updatedSets: ExerciseSet[] =
                            newExercise.sets.map((set, k) => {
                              return {
                                setNumber: set.setNumber,
                                paramValuesR: set.paramValuesR,
                                paramValuesL: [...set.paramValuesL].map(
                                  (param, index) => {
                                    if (
                                      index === paramIndex &&
                                      setIndex === k
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

                          const intensityVolumeValue =
                            TrainingService.getIntensityVolumeValues(
                              updatedSets
                            );

                          newExercise.sets = [...updatedSets];
                          updateTraining(
                            { exercise: newExercise, intensityVolumeValue },
                            {
                              training,
                              component,
                              setTraining,
                              setComponent,
                              supersets,
                              setSupersetsWithAdd,
                              filteredTrainings,
                              setFilteredTrainings,
                              setDetectedChanges,
                              selectedSubgroup,
                              setSelectedSubgroup,
                              supersetIndex,
                            }
                          );
                        }}
                      />

                      <ExerciseParam
                        showOptions={false}
                        disableOptions
                        disableSets
                        param={param}
                        value={valueR}
                        onOptionChange={(newValue) => {}}
                        min={min}
                        max={max}
                        onSubOptionChange={(newValue) => {
                          if (+newValue < 0) return;

                          // update only selected athletes workloads
                          if (selectedAthlete) {
                            handleAthleteWorkloadsChange(
                              {
                                exercise,
                                setNumber: set.setNumber,
                                param,
                                newValue: newValue as string,
                                leftOrRight: 'R',
                              },
                              {
                                training,
                                selectedAthleteWorkloads,
                                setCustomAthleteWorkloads,
                                selectedAthlete,
                                customAthleteWorkloads,
                              }
                            );
                            return;
                          }

                          const paramIndex = exercise.sets[
                            i
                          ].paramValuesR.findIndex(
                            (pv) => pv.field === param.field
                          );

                          const newExercise = { ...exercise };
                          const setIndex = newExercise.sets.findIndex(
                            (s) => s.setNumber === set.setNumber
                          );

                          const updatedSets: ExerciseSet[] =
                            newExercise.sets.map((set, k) => {
                              return {
                                setNumber: set.setNumber,
                                paramValuesL: set.paramValuesL,
                                paramValuesR: [...set.paramValuesR].map(
                                  (param, index) => {
                                    if (
                                      index === paramIndex &&
                                      setIndex === k
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

                          const intensityVolumeValue =
                            TrainingService.getIntensityVolumeValues(
                              updatedSets
                            );

                          newExercise.sets = [...updatedSets];
                          updateTraining(
                            { exercise: newExercise, intensityVolumeValue },
                            {
                              training,
                              component,
                              setTraining,
                              setComponent,
                              supersets,
                              setSupersetsWithAdd,
                              filteredTrainings,
                              setFilteredTrainings,
                              setDetectedChanges,
                              selectedSubgroup,
                              setSelectedSubgroup,
                              supersetIndex,
                            }
                          );
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
  );
}
