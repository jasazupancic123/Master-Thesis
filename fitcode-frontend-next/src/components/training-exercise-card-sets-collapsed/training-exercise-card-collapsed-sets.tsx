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
import { VolWorkSetType } from '@/controller/component/enum/param.enum';
import {
  getLAndRValues,
  handleAthleteWorkloadsChange,
  updateTraining,
} from '../training-exercise-card/state';
import { SetState } from '@/common/type/state.type';

interface TrainingExerciseCardCollapsedSetsProps {
  exercise: TrainingExercise;
  setExercise: SetState<TrainingExercise>;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  supersets: Superset[];
  setSupersetsWithAdd: SetState<Superset[]>;
  setsNumber: number;
  setSetsNumber: SetState<number>;
  i: number | undefined;
  supersetIndex: number;
}

export default function TrainingExerciseCardCollapsedSets(
  props: TrainingExerciseCardCollapsedSetsProps
) {
  const screenSize = useScreenSize();

  const {
    exercise,
    setExercise,
    expandedSetsView,
    setExpandedSetsView,
    supersets,
    setSupersetsWithAdd,
    setsNumber,
    setSetsNumber,
    i,
    supersetIndex,
  } = props;

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

  if (!training || !component) return null;

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
          <Box
            display="flex"
            flexDirection="column"
            gap={1}
            justifyContent="end"
            height={80}
          >
            <LeftRightExerciseText title="L" />
            <LeftRightExerciseText title="R" />
          </Box>
          {exercise.params.map((param, i) => {
            /* find the custom workload for the selected athlete if selected, otherwise
                get the value from the exercise sets */

            const { valueL, valueR } = getLAndRValues(
              {
                set: exercise.sets[0],
                param,
                setIndex: 0,
                paramIndex: i - 1,
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
                if (foundInOptions.field === VolWorkSetType.Set) {
                  if (foundInOptions.min && setsNumber < foundInOptions.min)
                    setSetsNumber(foundInOptions.min);
                  if (foundInOptions.max && setsNumber > foundInOptions.max)
                    setSetsNumber(foundInOptions.max);
                }
                min = foundInOptions.min;
                max = foundInOptions.max;
              } else {
                min = attributeRange.min;
                max = attributeRange.max;
              }
            }

            return (
              <>
                <Box
                  key={param.field}
                  flexBasis={(100 / exercise.params.length).toString() + '%'}
                >
                  <ExerciseParam
                    param={param}
                    value={
                      param.field === 'volWorkSets'
                        ? ({
                            field: valueL.field,
                            selected: valueL.selected,
                            value: setsNumber.toString(),
                          } as AttributeValue)
                        : valueL
                    }
                    exercise={exercise}
                    setsNumber={setsNumber}
                    setSetsNumber={setSetsNumber}
                    min={min}
                    max={max}
                    onOptionChange={(newValue) => {
                      const paramIndex =
                        exercise.sets[0].paramValuesL.findIndex(
                          (pv) => pv.field === param.field
                        );

                      const newExercise = { ...exercise };
                      newExercise.sets.forEach(({ paramValuesL }) => {
                        if (paramValuesL[paramIndex])
                          paramValuesL[paramIndex].selected =
                            newValue as string;
                      });

                      setExercise(newExercise);
                    }}
                    onSubOptionChange={(newValue) => {
                      if (+newValue < 0) return;

                      if (param.field === 'volWorkSets') {
                        setSetsNumber(+newValue);
                        return;
                      }

                      // update only selected athletes workloads
                      if (selectedAthlete) {
                        handleAthleteWorkloadsChange(
                          {
                            exercise,
                            setNumber: 1,
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
                          },
                          true
                        );
                        return;
                      }

                      const paramIndex =
                        exercise.sets[0].paramValuesL.findIndex(
                          (pv) => pv.field === param.field
                        );

                      const newExercise = { ...exercise };
                      const updatedSets: ExerciseSet[] = newExercise.sets.map(
                        (set) => {
                          return {
                            setNumber: set.setNumber,
                            paramValuesR: set.paramValuesR,
                            paramValuesL: [...set.paramValuesL].map(
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
                    param={param}
                    showOptions={false}
                    value={
                      param.field === 'volWorkSets'
                        ? ({
                            field: valueR.field,
                            selected: valueR.selected,
                            value: setsNumber.toString(),
                          } as AttributeValue)
                        : valueR
                    }
                    exercise={exercise}
                    setsNumber={setsNumber}
                    setSetsNumber={setSetsNumber}
                    min={min}
                    max={max}
                    onOptionChange={(newValue) => {
                      const paramIndex =
                        exercise.sets[0].paramValuesR.findIndex(
                          (pv) => pv.field === param.field
                        );

                      const newExercise = { ...exercise };
                      newExercise.sets.forEach(({ paramValuesR }) => {
                        if (paramValuesR[paramIndex])
                          paramValuesR[paramIndex].selected =
                            newValue as string;
                      });

                      setExercise(newExercise);
                    }}
                    onSubOptionChange={(newValue) => {
                      if (+newValue < 0) return;

                      if (param.field === 'volWorkSets') {
                        setSetsNumber(+newValue);
                        return;
                      }

                      // update only selected athletes workloads
                      if (selectedAthlete) {
                        handleAthleteWorkloadsChange(
                          {
                            exercise,
                            setNumber: 1,
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
                          },
                          true
                        );
                        return;
                      }

                      const paramIndex =
                        exercise.sets[0].paramValuesR.findIndex(
                          (pv) => pv.field === param.field
                        );

                      const newExercise = { ...exercise };
                      const updatedSets: ExerciseSet[] = newExercise.sets.map(
                        (set) => {
                          return {
                            setNumber: set.setNumber,
                            paramValuesL: set.paramValuesL,
                            paramValuesR: [...set.paramValuesR].map(
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
              </>
            );
          })}
        </Box>
      </Grid2>
    </Grid2>
  );
}
