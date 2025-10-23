import { CheckCircle } from '@mui/icons-material';
import { Box, Grid2 } from '@mui/material';
import { useTheme } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import {
  KG,
  REC_TIME,
  REPS,
  TEMPO,
} from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';
import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
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
  aiDetectionView?: boolean;
}

export default function AthleteTrainingExerciseSets({
  exercise,
  borderBottomRadius,
  expanded,
  trainingInProgressView,
  passedSet,
  setIndex,
  supersetIndex,
  exerciseSetTrackingState,
  dissableBottomPadding,
}: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const { updateTrainingInProgress } = useTraining();

  const uni = exercise.exercise?.isUnilateral;
  const load = passedSet?.loadKg || exercise.sets[0]?.loadKg; // always in kg

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
        const index = setIndex !== undefined ? setIndex : i;

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
                <NumberExerciseParam
                  options={[REPS]}
                  selected={REPS.field}
                  value={exercise.sets[index]?.reps}
                  exercise={exercise}
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[index].reps = +value;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />

                {load && (
                  <NumberExerciseParam
                    options={[KG]}
                    selected={KG.field} // always in kg
                    value={exercise.sets[index]?.loadKg || 0}
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      exercise.sets[index].loadKg = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                )}

                <TempoExerciseParam
                  options={[TEMPO]}
                  selected={TEMPO.field}
                  value={exercise.sets[index]?.tempo || ''}
                  exercise={exercise}
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[index].tempo = value as string;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />

                <NumberExerciseParam
                  options={[REC_TIME]}
                  selected={REC_TIME.field}
                  value={exercise.sets[index].recTime}
                  exercise={exercise}
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[index].recTime = +value;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              </Box>

              {uni && (
                <Box
                  display="flex"
                  width="100%"
                  justifyContent="center"
                  alignItems="center"
                  gap={1}
                >
                  <NumberExerciseParam
                    options={[REPS]}
                    selected={REPS.field}
                    value={
                      exercise.sets[index]?.repsR || exercise.sets[index]?.reps
                    }
                    exercise={exercise}
                    showOptions={false}
                    onInputChange={(value) => {
                      exercise.sets[index].repsR = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />

                  <NumberExerciseParam
                    options={[KG]}
                    selected={KG.field}
                    value={
                      exercise.sets[index]?.loadKgR ||
                      exercise.sets[index]?.loadKg ||
                      0
                    }
                    exercise={exercise}
                    showOptions={false}
                    disableOptions
                    onInputChange={(value) => {
                      exercise.sets[index].loadKgR = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />

                  <TempoExerciseParam
                    options={[TEMPO]}
                    selected={TEMPO.field}
                    value={
                      exercise.sets[index]?.tempoR ||
                      exercise.sets[index]?.tempo ||
                      ''
                    }
                    exercise={exercise}
                    showOptions={false}
                    disableOptions
                    onInputChange={(value) => {
                      exercise.sets[index].tempoR = value.toString();
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />

                  <NumberExerciseParam
                    options={[REC_TIME]}
                    selected={REC_TIME.field}
                    value={exercise.sets[index].recTime}
                    exercise={exercise}
                    showOptions={false}
                    disableOptions
                    onInputChange={(value) => {
                      exercise.sets[index].recTime = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                </Box>
              )}
            </Grid2>

            <Grid2 size={0.5} display="flex" alignItems="flex-end">
              {exerciseSetTrackingState &&
                exerciseSetTrackingState.find(
                  (setState) =>
                    setState.exerciseId === exercise.id &&
                    setState.completedSetNumbers.includes(set.setNumber)
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
