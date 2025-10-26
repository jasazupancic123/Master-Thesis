import { Box, Grid2 } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import TrainingExerciseSetDoneCheckbox from './training-exercise-set-done-checkbox';
import {
  KG,
  REC_TIME,
  REPS,
  SETS,
  TEMPO,
} from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExerciseExtended } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
  set: ExerciseSet;
  exercise: TrainingExerciseExtended;
  selectedSuperset: Superset;
  setSelectedSuperset: SetState<Superset | undefined>;
  setIndex: number;
  showOptions?: boolean;
  showDoneCheckbox?: boolean;
}

export default function TrainingInProgressExerciseSet(props: Props) {
  const screenSize = useScreenSize();

  const { trainingInProgress, updateTrainingInProgress } = useTraining();

  const {
    set,
    exercise,
    setIndex: index,
    showOptions,
    showDoneCheckbox,
  } = props;

  if (!trainingInProgress) return null;

  const uni = exercise.exercise?.isUnilateral;
  const load = set?.loadKg || exercise.sets[0]?.loadKg; // always in kg
  const supersetIndex = exercise.supersetIndex;

  return (
    <Box width="100%" display="flex" alignItems="center">
      <Grid2
        container
        spacing={1}
        columns={11}
        px={screenSize.isSmallerThanLaptop ? 1 : 0}
      >
        <Grid2 size={0.5}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt={index === 0 ? 3.8 : 0.5}
          >
            <Box
              key="exercise-title"
              display="flex"
              flexDirection="column"
              gap={1}
            >
              {uni ? (
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
          >
            <NumberExerciseParam
              options={[SETS]}
              selected={SETS.field}
              value={set.setNumber}
              exercise={exercise}
              showOptions={showOptions}
              disable
              disableOptions
            />

            <NumberExerciseParam
              options={[REPS]}
              selected={REPS.field}
              value={exercise.sets[index]?.reps}
              exercise={exercise}
              showOptions={showOptions}
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
                showOptions={showOptions}
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
              showOptions={showOptions}
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
              showOptions={showOptions}
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
            >
              <NumberExerciseParam
                options={[SETS]}
                selected={SETS.field}
                value={set.setNumber}
                exercise={exercise}
                showOptions={false}
                disable
                disableOptions
              />
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
      </Grid2>

      {showDoneCheckbox && (
        <TrainingExerciseSetDoneCheckbox
          exercise={exercise}
          setIndex={set.setNumber - 1}
          applyTopMargin={showOptions}
          small
        />
      )}
    </Box>
  );
}
