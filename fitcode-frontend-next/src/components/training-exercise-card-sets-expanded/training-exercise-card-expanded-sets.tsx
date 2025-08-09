import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import { ExerciseParam } from '../exercise-param/exercise-param';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import { getLAndRValues } from '../training-exercise-card/state';
import { updateExerciseAttributeValues } from './state';
import type { SetState } from '@/common/type/state.type';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import { TrainingService } from '@/controller/training/training.service';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface TrainingExerciseCarExpandedSetsProps {
  component: TrainingComponent;
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
}

export default function TrainingExerciseCardExpandedSets(
  props: TrainingExerciseCarExpandedSetsProps
) {
  const screenSize = useScreenSize();

  const { methods } = useMain();

  const {
    training,
    component,
    supersets,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    selectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    selectedExercises,
  } = useTrainerDayViewContext();

  const { setDetectedChanges } = useGroup();
  const { setTraining } = useTrainerDayViewContext();

  const { exercise, expandedSetsView, setExpandedSetsView } = props;

  if (!training || !component) return null;

  return (
    <Box display="flex" flexDirection="column" width="100%" gap={0.9}>
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
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.9}
                mt={i === 0 ? 0.9 : 0.5}
              >
                {i === 0 && (
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
                )}

                <Box
                  key="exercise-title"
                  display="flex"
                  flexDirection="column"
                  gap={0.9}
                >
                  <LeftRightExerciseText key="L" title="L" />
                  <LeftRightExerciseText key="R" title="R" />
                </Box>
              </Box>
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

                  let min: number | undefined;
                  let max: number | undefined;

                  const method = methods.find(
                    (m) => m.id === component.methodId
                  );

                  const attributeRange = method?.attributes.find(
                    (a) => a.field === param.field
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
                      {['L', 'R'].map((lOrR) => (
                        <ExerciseParam
                          key={`${param.field}-${lOrR}`}
                          showOptions={set.setNumber === 1 && lOrR === 'L'}
                          disableOptions
                          disableSets
                          param={param}
                          value={lOrR === 'L' ? valueL : valueR}
                          onOptionChange={() => {}}
                          min={min}
                          max={max}
                          onSubOptionChange={(newValue) => {
                            if (+newValue < 0) return;

                            // update only selected athletes workloads
                            if (selectedAthlete) {
                              const exercisesToUpdate = selectedExercises.some(
                                (ex) => ex.id === exercise.id
                              )
                                ? selectedExercises
                                : [exercise];

                              for (const selectedExercise of exercisesToUpdate) {
                                const exerciseSupersetIndex =
                                  supersets.findIndex((s) =>
                                    s.exercises.some(
                                      (ex) => ex.id === selectedExercise.id
                                    )
                                  );

                                if (exerciseSupersetIndex === -1) {
                                  toast.error(
                                    `Superset for exercise ${selectedExercise.exercise?.name || 'Unknown Exercise'} not found`
                                  );
                                  return;
                                }

                                const existingWorkload =
                                  selectedAthleteWorkloads.futureWorkloads.find(
                                    (w) =>
                                      w.componentId === component.id &&
                                      w.exerciseId === selectedExercise.id &&
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
                                      w.exerciseId === selectedExercise.id &&
                                      w.setNumber === set.setNumber &&
                                      w.userId === selectedAthlete.uid
                                  );

                                  if (existingIndex !== -1) {
                                    const newWorkloads = [...prev];
                                    newWorkloads[existingIndex] = {
                                      ...newWorkloads[existingIndex],
                                      supersetIndex: exerciseSupersetIndex,
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
                                      exerciseId: selectedExercise.id,
                                      supersetIndex: exerciseSupersetIndex,
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

                            // update only the changed exercise
                            updateExerciseAttributeValues(
                              {
                                newValue,
                                i,
                                set,
                                lOrR: lOrR as 'L' | 'R',
                              },
                              {
                                selectedExercises,
                                exercise,
                                param,
                                training,
                                component,
                                setTraining,
                                supersets,
                                setDetectedChanges,
                                selectedSubgroup,
                                setSelectedSubgroup,
                              }
                            );
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
      })}
    </Box>
  );
}
