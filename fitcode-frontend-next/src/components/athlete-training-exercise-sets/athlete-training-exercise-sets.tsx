import { CheckCircle } from '@mui/icons-material';
import { Box, Grid2 } from '@mui/material';
import { useTheme } from '@mui/material';
import toast from 'react-hot-toast';

import { ExerciseParam } from '../exercise-param/exercise-param';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';
import { getLAndRValues } from '../training-exercise-card/state';
import { updateExerciseAttributeValues } from '../training-exercise-card-sets-expanded/state';
import type { ExerciseSetTracking } from '@/common/type/exercise-set-tracking-state.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';

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
            px={screenSize.isSmallerThanLaptop ? 1 : 0}
          >
            <Grid2 size={0.5}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.9}
                mt={
                  i === 0
                    ? trainingInProgressView
                      ? 4.25
                      : 3.7
                    : trainingInProgressView
                      ? 3.75
                      : 3.7
                }
              >
                <Box
                  key="exercise-title"
                  display="flex"
                  flexDirection="column"
                  gap={trainingInProgressView ? 1.35 : 0.9}
                >
                  {exercise.exercise?.isBilateral ? (
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
                gap={1}
              >
                {exercise.params
                  .filter((p) => p.field !== ParamType.VolWorkSets)
                  .map((param, j) => {
                    /* find the custom workload for the selected athlete if selected, otherwise
                      get the value from the exercise sets */
                    const { valueL, valueR } = getLAndRValues(
                      {
                        set,
                        param,
                        setIndex:
                          setIndex !== undefined && setIndex !== null
                            ? setIndex
                            : i,
                        paramIndex: j - 1,
                      },
                      {
                        training,
                        exercise,
                        selectedAthleteWorkloads: [],
                        selectedAthlete: undefined,
                      }
                    );

                    if (!valueL || (exercise.exercise?.isBilateral && !valueR))
                      return toast.error(
                        `Invalid parameter field: ${param.field}`
                      );

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
                              showOptions={lOrR === 'L'}
                              disableOptions
                              disableSets={!trainingInProgressView}
                              dissableSettingValue={
                                param.field === ParamType.VolWorkSets ||
                                (trainingInProgressView && !passedSet)
                              }
                              colorToPrimary={
                                colorSetsToPrimary &&
                                param.field === ParamType.VolWorkSets
                              }
                              exercise={exercise}
                              // trainingInProgressView
                              param={param}
                              lOrR={lOrR as 'L' | 'R'}
                              value={
                                lOrR === 'L'
                                  ? param.field === ParamType.VolWorkSets
                                    ? ({
                                        ...valueL,
                                        value: passedSet
                                          ? passedSet.setNumber
                                          : !expanded
                                            ? exercise.sets.length
                                            : set.setNumber.toString(),
                                      } as AttributeValue)
                                    : valueL
                                  : param.field === ParamType.VolWorkSets
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

                                if (param.field === ParamType.VolWorkSets)
                                  return;

                                if (+newValue < 0) return;

                                updateExerciseAttributeValues(
                                  {
                                    newValue,
                                    i,
                                    set,
                                    lOrR: lOrR as 'L' | 'R',
                                  },
                                  {
                                    selectedExercises: [exercise],
                                    exercise: exercise,
                                    param,
                                    training,
                                    component:
                                      trainingInProgress.selectedComponent,
                                    setTraining: () => {},
                                    supersets: trainingInProgress.supersets,
                                    setDetectedChanges: () => {},
                                    selectedSubgroup: null,
                                    setSelectedSubgroup: () => {},
                                  }
                                );

                                updateTrainingInProgress(
                                  exercise,
                                  supersetIndex
                                );
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
                    estState.supersetIndex === supersetIndex &&
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
