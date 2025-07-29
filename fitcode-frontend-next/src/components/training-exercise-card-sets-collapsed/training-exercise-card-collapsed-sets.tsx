import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, Grid2, IconButton } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useScreenSize } from '@/store/screen-size-provider';
import { ExerciseParam } from '../exercise-param/exercise-param';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import { useGroup } from '@/store/group-provider';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { TrainingService } from '@/controller/training/training.service';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import toast from 'react-hot-toast';
import {
  ParamType,
  VolWorkSetType,
} from '@/controller/component/enum/param.enum';
import {
  getLAndRValues,
  updateTraining,
} from '../training-exercise-card/state';
import { SetState } from '@/common/type/state.type';
import { IntensityVolumeValues } from '@/controller/training/type/intensity-volume-values.type';
import { useEffect, useState } from 'react';
import { useSupersets } from '@/store/supersets-provider';
import { PrescribedWorkload } from '@/controller/training/type/workload-value.type';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import { v4 } from 'uuid';
import { useMain } from '@/store/main-provider';
import { TrainingComponent } from '@/controller/training/type/training-component.type';

interface TrainingExerciseCardCollapsedSetsProps {
  component: TrainingComponent;
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  supersetIndex: number;
  i: number | undefined;
}

export default function TrainingExerciseCardCollapsedSets(
  props: TrainingExerciseCardCollapsedSetsProps
) {
  const screenSize = useScreenSize();

  const { exercise, supersetIndex, expandedSetsView, setExpandedSetsView, i } =
    props;

  const { setsNumbers, setSetsNumbers } = useSupersets();

  const { methods } = useMain();

  const {
    training,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    selectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    selectedExercises,
    setSupersets,
  } = useTrainerDayViewContext();

  const { setDetectedChanges } = useGroup();
  const { setTraining, supersets } = useTrainerDayViewContext();

  const [setNumber, setSetsNumber] = useState(
    setsNumbers.find((sn) => sn.exerciseId === exercise.id)?.setsNumber ||
      undefined
  );

  useEffect(() => {
    setSetsNumber(
      setsNumbers.find((sn) => sn.exerciseId === exercise.id)?.setsNumber
    );
  }, [setsNumbers]);

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
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.9}
          mt={0.8}
        >
          <IconButton
            disableRipple
            sx={{
              p: 0,
              m: 0,
            }}
            onClick={() => setExpandedSetsView(!expandedSetsView)}
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
          <Box
            key="exercise-title"
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <LeftRightExerciseText key="L" title="L" />
            <LeftRightExerciseText key="R" title="R" />
          </Box>
        </Box>
      </Grid2>

      <Grid2 size={10}>
        <Box
          key={exercise.id}
          display="flex"
          width="100%"
          justifyContent="center"
          alignItems="center"
          gap={1}
        >
          {Array.isArray(exercise.params) &&
            exercise.params.map((param, i) => {
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

              if (setNumber === undefined || setNumber === null) return null;

              let min: number | undefined;
              let max: number | undefined;

              const method = methods.find((m) => m.id === component.methodId);
              const attributeRange = method?.attributes.find(
                (a) => a.field === param.field
              );

              if (attributeRange) {
                const foundInOptions = attributeRange.options?.find(
                  (option) => option.field === valueL.selected
                );

                if (foundInOptions) {
                  if (foundInOptions.field === VolWorkSetType.Set) {
                    if (
                      foundInOptions.min &&
                      setNumber !== undefined &&
                      setNumber < foundInOptions.min
                    ) {
                      if (
                        selectedExercises.length &&
                        selectedExercises.some((e) => e.id === exercise.id)
                      ) {
                        const updatedSetsNumbers = [...setsNumbers];

                        for (const selectedExercise of selectedExercises) {
                          const existingIndex = updatedSetsNumbers.findIndex(
                            (sn) => sn.exerciseId === selectedExercise.id
                          );

                          const newSetNumber = {
                            exerciseId: selectedExercise.id,
                            setsNumber: foundInOptions.min,
                          };

                          if (existingIndex !== -1) {
                            updatedSetsNumbers[existingIndex] = newSetNumber;
                          } else {
                            updatedSetsNumbers.push(newSetNumber);
                          }
                        }

                        setSetsNumbers(updatedSetsNumbers);
                      } else {
                        const newSetNumber = {
                          exerciseId: exercise.id,
                          setsNumber: foundInOptions.min,
                        };
                        setSetsNumbers((prev) => {
                          const existingIndex = prev.findIndex(
                            (sn) => sn.exerciseId === exercise.id
                          );
                          if (existingIndex !== -1) {
                            const newSetsNumber = [...prev];
                            newSetsNumber[existingIndex] = newSetNumber;
                            return newSetsNumber;
                          }
                          return [...prev, newSetNumber];
                        });
                      }
                    }
                    if (
                      foundInOptions.max &&
                      setNumber !== undefined &&
                      setNumber > foundInOptions.max
                    ) {
                      if (
                        selectedExercises.length &&
                        selectedExercises.some((e) => e.id === exercise.id)
                      ) {
                        const updatedSetsNumbers = [...setsNumbers];

                        for (const selectedExercise of selectedExercises) {
                          const existingIndex = updatedSetsNumbers.findIndex(
                            (sn) => sn.exerciseId === selectedExercise.id
                          );

                          const newSetNumber = {
                            exerciseId: selectedExercise.id,
                            setsNumber: foundInOptions.max,
                          };

                          if (existingIndex !== -1) {
                            updatedSetsNumbers[existingIndex] = newSetNumber;
                          } else {
                            updatedSetsNumbers.push(newSetNumber);
                          }
                        }

                        setSetsNumbers(updatedSetsNumbers);
                      } else {
                        const newSetNumber = {
                          exerciseId: exercise.id,
                          setsNumber: foundInOptions.max,
                        };
                        setSetsNumbers((prev) => {
                          const existingIndex = prev.findIndex(
                            (sn) => sn.exerciseId === exercise.id
                          );
                          if (existingIndex !== -1) {
                            const newSetsNumber = [...prev];
                            newSetsNumber[existingIndex] = newSetNumber;
                            return newSetsNumber;
                          }
                          return [...prev, newSetNumber];
                        });
                      }
                    }
                  }
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
                  flexBasis={(100 / exercise.params.length).toString() + '%'}
                >
                  {['L', 'R'].map((lOrR) => (
                    <ExerciseParam
                      key={`${param.field}-${lOrR}`}
                      param={param}
                      value={
                        param.field === ParamType.VolWorkSets
                          ? lOrR === 'L'
                            ? ({
                                field: valueL.field,
                                selected: valueL.selected,
                                value: setNumber.toString(),
                              } as AttributeValue)
                            : ({
                                field: valueR.field,
                                selected: valueR.selected,
                                value: setNumber.toString(),
                              } as AttributeValue)
                          : lOrR === 'L'
                            ? valueL
                            : valueR
                      }
                      showOptions={lOrR === 'L'}
                      exercise={exercise}
                      setsNumbers={setsNumbers}
                      setSetsNumbers={setSetsNumbers}
                      min={min}
                      max={max}
                      onOptionChange={(newValue) => {
                        const paramIndex = (
                          lOrR === 'L'
                            ? exercise.sets[0].paramValuesL
                            : exercise.sets[0].paramValuesR
                        ).findIndex((pv) => pv.field === param.field);

                        const newExercise = { ...exercise };
                        if (lOrR === 'L') {
                          newExercise.sets.forEach(({ paramValuesL }) => {
                            if (paramValuesL[paramIndex])
                              paramValuesL[paramIndex].selected =
                                newValue as string;
                          });
                        } else {
                          newExercise.sets.forEach(({ paramValuesR }) => {
                            if (paramValuesR[paramIndex])
                              paramValuesR[paramIndex].selected =
                                newValue as string;
                          });
                        }

                        setSupersets((prev) => {
                          const existingIndex = prev.findIndex((s) =>
                            s.exercises.some((ex) => ex.id === exercise.id)
                          );
                          if (existingIndex !== -1) {
                            const newSupersets = [...prev];
                            newSupersets[existingIndex].exercises =
                              newSupersets[existingIndex].exercises.map((ex) =>
                                ex.id === exercise.id ? newExercise : ex
                              );
                            return newSupersets;
                          }
                          return prev;
                        });

                        // setExercise(newExercise);
                      }}
                      onSubOptionChange={(newValue) => {
                        if (+newValue < 0) return;

                        if (param.field === 'volWorkSets') {
                          if (
                            selectedExercises.length &&
                            selectedExercises.some((e) => e.id === exercise.id)
                          ) {
                            const updatedSetsNumbers = [...setsNumbers];

                            for (const selectedExercise of selectedExercises) {
                              const existingIndex =
                                updatedSetsNumbers.findIndex(
                                  (sn) => sn.exerciseId === selectedExercise.id
                                );

                              const newSetNumber = {
                                exerciseId: selectedExercise.id,
                                setsNumber: +newValue,
                              };

                              if (existingIndex !== -1) {
                                updatedSetsNumbers[existingIndex] =
                                  newSetNumber;
                              } else {
                                updatedSetsNumbers.push(newSetNumber);
                              }
                            }

                            setSetsNumbers(updatedSetsNumbers);
                          } else {
                            const newSetNumber = {
                              exerciseId: exercise.id,
                              setsNumber: +newValue,
                            };
                            setSetsNumbers((prev) => {
                              const existingIndex = prev.findIndex(
                                (sn) => sn.exerciseId === exercise.id
                              );
                              if (existingIndex !== -1) {
                                const newSetsNumber = [...prev];
                                newSetsNumber[existingIndex] = newSetNumber;
                                return newSetsNumber;
                              }
                              return [...prev, newSetNumber];
                            });
                          }
                          return;
                        }

                        // update only selected athletes workloads
                        if (selectedAthlete) {
                          for (const set of exercise.sets) {
                            const existingWorkload =
                              selectedAthleteWorkloads.futureWorkloads.find(
                                (w) =>
                                  w.componentId === component.id &&
                                  w.exerciseId === exercise.id &&
                                  w.supersetIndex === supersetIndex &&
                                  w.setNumber === set.setNumber &&
                                  w.userId === selectedAthlete.uid
                              );

                            const newCustomWorkload =
                              existingWorkload ||
                              TrainingService.getPrescribedWorkload(set);

                            const fieldName =
                              TrainingService.getPerscribedFieldName(
                                param,
                                lOrR as 'L' | 'R'
                              );

                            // edit the field that was changed
                            newCustomWorkload[fieldName] =
                              +newValue as unknown as undefined;

                            // add the new workload to the custom athlete workloads
                            setCustomAthleteWorkloads((prev) => {
                              const existingIndex = prev.findIndex(
                                (w) =>
                                  w.componentId === component.id &&
                                  w.exerciseId === exercise.id &&
                                  w.supersetIndex === supersetIndex &&
                                  w.setNumber === set.setNumber &&
                                  w.userId === selectedAthlete.uid
                              );

                              if (existingIndex !== -1) {
                                const newWorkloads = [...prev];
                                newWorkloads[existingIndex] = {
                                  ...newWorkloads[existingIndex],
                                  [fieldName]:
                                    +newValue as unknown as undefined,
                                };

                                return newWorkloads;
                              }

                              // if not found, add a new workload
                              return [
                                ...prev,
                                {
                                  ...newCustomWorkload,
                                  id: v4(),
                                  componentId: component.id,
                                  exerciseId: exercise.id,
                                  supersetIndex: supersetIndex,
                                  setNumber: set.setNumber,
                                  userId: selectedAthlete.uid,
                                  institutionId: undefined,
                                  groupId: undefined,
                                  cycleId: undefined,
                                  trainingId: training.id,
                                  status: SetStatus.NOT_STARTED,
                                  notes: '',
                                  createdAt: new Date(),
                                  updatedAt: new Date(),
                                  plannedAt: component.from,
                                  deletedAt: undefined,
                                },
                              ];
                            });
                          }

                          return;
                        }

                        if (
                          !selectedExercises.length ||
                          !selectedExercises.some((ex) => ex.id === exercise.id)
                        ) {
                          const paramIndex = (
                            lOrR === 'L'
                              ? exercise.sets[0].paramValuesL
                              : exercise.sets[0].paramValuesR
                          ).findIndex((pv) => pv.field === param.field);

                          if (paramIndex === undefined) return;

                          const newExercise = { ...exercise };
                          const updatedSets: ExerciseSet[] =
                            newExercise.sets.map((set) => {
                              return lOrR === 'L'
                                ? {
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
                                  }
                                : {
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
                            });

                          const intensityVolumeValue =
                            TrainingService.getIntensityVolumeValues(
                              updatedSets
                            );

                          newExercise.sets = [...updatedSets];
                          updateTraining(
                            {
                              exercises: [newExercise],
                              intensityVolumeValues: [intensityVolumeValue],
                            },
                            {
                              training,
                              component,
                              setTraining,
                              supersets,
                              setDetectedChanges,
                              selectedSubgroup,
                              setSelectedSubgroup,
                            }
                          );
                        } else {
                          const updatedExercises = [] as TrainingExercise[];
                          const intensityVolumeValues =
                            [] as IntensityVolumeValues[];

                          for (const selectedExercise of selectedExercises) {
                            const paramIndex = (
                              lOrR === 'L'
                                ? selectedExercise.sets[0].paramValuesL
                                : selectedExercise.sets[0].paramValuesR
                            ).findIndex((pv) => pv.field === param.field);

                            if (paramIndex === undefined) continue;

                            const updatedSets: ExerciseSet[] =
                              selectedExercise.sets.map((set) => {
                                return lOrR === 'L'
                                  ? {
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
                                    }
                                  : {
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
                              });

                            const intensityVolumeValue =
                              TrainingService.getIntensityVolumeValues(
                                updatedSets
                              );

                            selectedExercise.sets = [...updatedSets];
                            updatedExercises.push(selectedExercise);
                            intensityVolumeValues.push(intensityVolumeValue);
                          }

                          updateTraining(
                            {
                              exercises: updatedExercises,
                              intensityVolumeValues: intensityVolumeValues,
                            },
                            {
                              training,
                              component,
                              setTraining,
                              supersets,
                              setDetectedChanges,
                              selectedSubgroup,
                              setSelectedSubgroup,
                            }
                          );
                        }
                      }}
                    />
                  ))}
                </Box>
              );
            })}
        </Box>
      </Grid2>
    </Grid2>
  );
}
