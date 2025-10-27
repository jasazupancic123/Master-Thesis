import { CheckCircle } from '@mui/icons-material';
import { Box, Grid2 } from '@mui/material';
import { useTheme } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import { core } from '@/core/core.service';
import { KG, SETS } from '@/core/exercise/constant/exercise-param.constant';
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
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);
  const load = exercise.sets[setIndex || 0].loadKg;

  const volOptions = core.training.set.getVolOptions(exercise.exercise!);
  const intOptions = core.training.set.getIntOptions(exercise.exercise!);
  const effOptions = core.training.set.getEffOptions(exercise.exercise!);
  const recOptions = core.training.set.getRecOptions(exercise.exercise!);

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
                  options={[SETS]}
                  selected="sets"
                  value={index + 1}
                  exercise={exercise}
                  disableOptions
                  disable
                />

                {volType && volOptions.length > 0 && (
                  <NumberExerciseParam
                    options={volOptions}
                    selected={volType}
                    value={exercise.sets[index]?.[volType] || 0}
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      exercise.sets[index][volType] = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                )}

                {load && intOptions.length > 0 && (
                  <NumberExerciseParam
                    options={[KG]}
                    selected="loadKg"
                    value={exercise.sets[index]?.loadKg || 0}
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      exercise.sets[index].loadKg = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                )}

                {effType && effOptions.length > 0 ? (
                  effType === 'tempo' ? (
                    <TempoExerciseParam
                      options={effOptions}
                      selected="tempo"
                      value={exercise.sets[index]?.tempo || ''}
                      exercise={exercise}
                      disableOptions
                      onInputChange={(value) => {
                        exercise.sets[index].tempo = value.toString();
                        updateTrainingInProgress(exercise, supersetIndex || 0);
                      }}
                    />
                  ) : (
                    <NumberExerciseParam
                      options={effOptions}
                      selected="eff"
                      value={exercise.sets[index]?.eff || 0}
                      exercise={exercise}
                      disableOptions
                      onInputChange={(value) => {
                        exercise.sets[index].eff = +value;
                        updateTrainingInProgress(exercise, supersetIndex || 0);
                      }}
                    />
                  )
                ) : null}

                {recType && recOptions.length > 0 && (
                  <NumberExerciseParam
                    options={recOptions}
                    selected={recType}
                    value={exercise.sets[index][recType] || 0}
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      exercise.sets[index][recType] = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                )}
              </Box>

              {uni && (
                <Box
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <NumberExerciseParam
                    options={[SETS]}
                    selected="sets"
                    value={index + 1}
                    exercise={exercise}
                    disableOptions
                    showOptions={false}
                    disable
                  />

                  {volType && volOptions.length > 0 && (
                    <NumberExerciseParam
                      options={volOptions}
                      selected={volType}
                      value={
                        exercise.sets[0]?.[
                          volType === 'reps' ? 'repsR' : volType
                        ] as number
                      }
                      exercise={exercise}
                      showOptions={false}
                      onInputChange={(value) => {
                        const field = core.exercise.param.pairs[
                          volType
                        ] as typeof volType;

                        exercise.sets[index][field] = +value;
                        updateTrainingInProgress(exercise, supersetIndex || 0);
                      }}
                    />
                  )}

                  {load && intOptions.length > 0 && (
                    <NumberExerciseParam
                      options={[KG]}
                      selected={KG.field}
                      value={exercise.sets[index]?.loadKgR || 0}
                      exercise={exercise}
                      showOptions={false}
                      disableOptions
                      onInputChange={(value) => {
                        exercise.sets[index].loadKgR = +value;
                        updateTrainingInProgress(exercise, supersetIndex || 0);
                      }}
                    />
                  )}

                  {effType && effOptions.length > 0 ? (
                    effType === 'tempo' ? (
                      <TempoExerciseParam
                        options={effOptions}
                        selected="tempo"
                        value={exercise.sets[index]?.tempoR || ''}
                        exercise={exercise}
                        showOptions={false}
                        disableOptions
                        onInputChange={(value) => {
                          exercise.sets[index].tempoR = value.toString();
                          updateTrainingInProgress(
                            exercise,
                            supersetIndex || 0
                          );
                        }}
                      />
                    ) : (
                      <NumberExerciseParam
                        options={effOptions}
                        selected="eff"
                        value={exercise.sets[index]?.eff || 0}
                        exercise={exercise}
                        showOptions={false}
                        disableOptions
                        onInputChange={(value) => {
                          exercise.sets[index].eff = +value;
                          updateTrainingInProgress(
                            exercise,
                            supersetIndex || 0
                          );
                        }}
                      />
                    )
                  ) : null}

                  {recType && recOptions.length > 0 && (
                    <NumberExerciseParam
                      options={recOptions}
                      selected={recType}
                      value={exercise.sets[index][recType] || 0}
                      exercise={exercise}
                      showOptions={false}
                      disableOptions
                      onInputChange={(value) => {
                        exercise.sets[index][recType] = +value;
                        updateTrainingInProgress(exercise, supersetIndex || 0);
                      }}
                    />
                  )}
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
