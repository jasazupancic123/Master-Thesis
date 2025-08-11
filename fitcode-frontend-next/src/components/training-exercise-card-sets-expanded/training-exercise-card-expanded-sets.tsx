import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Grid2, IconButton } from '@mui/material';
import toast from 'react-hot-toast';

import { ExerciseParam } from '../exercise-param/exercise-param';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import { getLAndRValues } from '../training-exercise-card/state';
import {
  updateExerciseAttributeValues,
  updateExpandedSelectedAthleteValues,
} from './state';
import type { SetState } from '@/common/type/state.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { ParamType } from '@/controller/component/enum/param.enum';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

interface TrainingExerciseCarExpandedSetsProps {
  component: TrainingComponent;
  exercise: TrainingExercise;
  expandedSetsView: boolean;
  setExpandedSetsView: SetState<boolean>;
  supersetIndex: number;
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

  const { exercise, expandedSetsView, setExpandedSetsView, supersetIndex } =
    props;

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
                  {exercise.exercise?.isBilateral ? (
                    <>
                      <LeftRightExerciseText title="L" />
                      <LeftRightExerciseText title="R" />
                    </>
                  ) : (
                    <LeftRightExerciseText title="" />
                  )}
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

                  if (!valueL || (exercise.exercise?.isBilateral && !valueR))
                    return toast.error(
                      `Invalid parameter field: ${param.field}`
                    );

                  let min: number | undefined;
                  let max: number | undefined;

                  const method = methods.find(
                    (m) => m.id === component.methodId
                  );

                  const attributeRange = method?.attributes
                    ?.map((a) =>
                      a.options?.find((o) => o.field === valueL.selected)
                    )
                    .find(Boolean);

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
                      {['L']
                        .concat(exercise.exercise?.isBilateral ? ['R'] : [])
                        .map((lOrR) => (
                          <ExerciseParam
                            key={`${param.field}-${lOrR}`}
                            showOptions={set.setNumber === 1 && lOrR === 'L'}
                            disableOptions
                            disableSets
                            param={param}
                            value={
                              lOrR === 'L'
                                ? param.field === ParamType.VolWorkSets
                                  ? ({
                                      ...valueL,
                                      value: set.setNumber.toString(),
                                    } as AttributeValue)
                                  : valueL
                                : param.field === ParamType.VolWorkSets
                                  ? ({
                                      ...valueR,
                                      value: set.setNumber.toString(),
                                    } as AttributeValue)
                                  : valueR || undefined
                            }
                            onOptionChange={(_newValue) => {}}
                            min={min}
                            max={max}
                            onSubOptionChange={(newValue) => {
                              if (+newValue < 0) return;

                              // update only selected athletes workloads
                              if (selectedAthlete) {
                                updateExpandedSelectedAthleteValues(
                                  {
                                    exercise,
                                    param,
                                    set,
                                    lOrR,
                                    newValue,
                                  },
                                  {
                                    training,
                                    component,
                                    supersets,
                                    selectedExercises,
                                    selectedAthlete,
                                    selectedAthleteWorkloads,
                                    setCustomAthleteWorkloads,
                                  }
                                );
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
