import { CheckCircle } from '@mui/icons-material';
import { Box, Grid2 } from '@mui/material';
import { useTheme } from '@mui/material';
import toast from 'react-hot-toast';

import type { AttributeValue } from '@/core/attribute/type/attribute-value.type';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';
import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import LeftRightExerciseText from '@/util/left-right-exercise-text/left-right-exercise-text';

interface AthleteTrainingExerciseSetsProps {
  training: Training;
  exercise: TrainingExercise;
  borderBottomRadius: boolean;
  expanded?: boolean;
  trainingInProgressView?: boolean;
  passedSet?: ExerciseSet;
  setIndex?: number;
  supersetIndex?: number;
  exerciseSetTrackingState?: ExerciseSetTracking[];
  dissableBottomPadding?: boolean;
  colorSetsToPrimary?: boolean;
  aiDetectionView?: boolean;
}

export default function AthleteTrainingExerciseSets(
  props: AthleteTrainingExerciseSetsProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { trainingInProgress, updateTrainingInProgress } = useTraining();

  const {
    training,
    exercise,
    borderBottomRadius,
    expanded,
    trainingInProgressView,
    passedSet,
    setIndex,
    supersetIndex,
    exerciseSetTrackingState,
    dissableBottomPadding,
    colorSetsToPrimary,
  } = props;

  return (
    <Box
      id="athlete-training-exercise-sets-container"
      display="flex"
      flexDirection="column"
      width="100%"
      gap={0.9}
      sx={{
        backgroundColor: trainingInProgressView
          ? theme.palette.background.default
          : theme.palette.background.dark,
        pb: !dissableBottomPadding ? 1 : undefined,
        borderBottomRightRadius: borderBottomRadius ? '5px' : 0,
        borderBottomLeftRadius: borderBottomRadius ? '5px' : 0,
      }}
    >
      {/* Expanded sets view */}
      {(passedSet ? [passedSet] : exercise.sets).map((set, i) => {
        if (!expanded && i > 0) return null;

        return (
          <Grid2
            key={i}
            container
            spacing={0.5}
            columns={11}
            px={
              trainingInProgressView
                ? 0
                : screenSize.isSmallerThanLaptop
                  ? 1
                  : 0
            }
          >
            <Grid2 size={0.5}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.9}
                mt={3.7}
              >
                <Box
                  key="exercise-title"
                  display="flex"
                  flexDirection="column"
                  gap={trainingInProgressView ? 0.9 : 0.9}
                >
                  {exercise.exercise?.isUnilateral ? (
                    <>
                      <LeftRightExerciseText title="L" />
                      <LeftRightExerciseText title="R" />
                    </>
                  ) : (
                    <LeftRightExerciseText
                      title={trainingInProgressView ? '' : 'B'}
                    />
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
              >
                {exercise.params.map((param, j) => {
                  /* find the custom workload for the selected athlete if selected, otherwise
                      get the value from the exercise sets */
                  const { valueL, valueR } = getLAndRValues({
                    set,
                    param,
                    setIndex:
                      setIndex !== undefined && setIndex !== null
                        ? setIndex
                        : i,
                    paramIndex: j - 1,
                    exercise,
                  });

                  if (!valueL || (exercise.exercise?.isUnilateral && !valueR))
                    return toast.error(`Invalid parameter field: ${param}`);

                  return (
                    <Box
                      key={param}
                      width={
                        (
                          100 /
                          (trainingInProgress
                            ? exercise.params.length - 1
                            : exercise.params.length)
                        ).toString() + '%'
                      }
                    >
                      {['L']
                        .concat(exercise.exercise?.isUnilateral ? ['R'] : [])
                        .map((lOrR) => (
                          <ExerciseParam
                            key={`${param}-${lOrR}`}
                            showOptions={lOrR === 'L'}
                            disableOptions
                            disableSets={!trainingInProgressView}
                            disableSettingValue={
                              param === (ParamType.VolWorkSets as string) ||
                              (trainingInProgressView && !passedSet)
                            }
                            colorToPrimary={
                              colorSetsToPrimary &&
                              param === (ParamType.VolWorkSets as string)
                            }
                            exercise={exercise}
                            // trainingInProgressView
                            param={param}
                            lOrR={lOrR as 'L' | 'R'}
                            value={
                              lOrR === 'L'
                                ? param === (ParamType.VolWorkSets as string)
                                  ? ({
                                      ...valueL,
                                      value: passedSet
                                        ? passedSet.setNumber
                                        : !expanded
                                          ? exercise.sets.length
                                          : set.setNumber.toString(),
                                    } as AttributeValue)
                                  : valueL
                                : param === (ParamType.VolWorkSets as string)
                                  ? ({
                                      ...valueR,
                                      value: passedSet
                                        ? passedSet.setNumber
                                        : !expanded
                                          ? exercise.sets.length
                                          : set.setNumber.toString(),
                                    } as AttributeValue)
                                  : valueR || undefined
                            }
                            onOptionChange={() => {}}
                            onSubOptionChange={(newValue) => {
                              if (
                                !passedSet ||
                                !trainingInProgressView ||
                                supersetIndex === undefined ||
                                supersetIndex === null
                              )
                                return;

                              if (
                                !trainingInProgress ||
                                !trainingInProgress.selectedComponent
                              )
                                return null;

                              if (param === (ParamType.VolWorkSets as string))
                                return;

                              if (+newValue < 0) return;

                              updateExerciseAttributeValues(
                                {
                                  newValue,
                                  i,
                                  set,
                                  lOrR: lOrR as 'L' | 'R',
                                  correctSelectedExercises: [exercise],
                                  correctExercise: exercise,
                                  correctParam: param,
                                  correctSupersets:
                                    trainingInProgress.supersets,
                                  correctSelectedSubgroup: null,
                                },
                                {
                                  training,
                                  component:
                                    trainingInProgress.selectedComponent,
                                  setTraining: () => {},
                                  setDetectedChanges: () => {},
                                  setSelectedSubgroup: () => {},
                                }
                              );

                              updateTrainingInProgress(exercise, supersetIndex);
                            }}
                          />
                        ))}
                    </Box>
                  );
                })}
              </Box>
            </Grid2>
            <Grid2 size={0.5} display="flex" alignItems="flex-end">
              {exerciseSetTrackingState &&
                exerciseSetTrackingState.find(
                  (estState) =>
                    estState.exerciseId === exercise.id &&
                    estState.completedSetNumbers.includes(set.setNumber)
                ) && (
                  <CheckCircle
                    fontSize="small"
                    sx={{ color: theme.palette.primary.main, mb: 0.45 }}
                  />
                )}
            </Grid2>
          </Grid2>
        );
      })}
    </Box>
  );
}
