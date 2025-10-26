import { Box, Grid2 } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import TrainingExerciseSetDoneCheckbox from './training-exercise-set-done-checkbox';
import { core } from '@/core/core.service';
import {
  DIST,
  EFF,
  KG,
  REC_DIST,
  REC_TIME,
  REPS,
  SETS,
  TEMPO,
  TIME,
} from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExerciseExtended } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useTraining } from '@/store/training.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
  set: ExerciseSet;
  exercise: TrainingExerciseExtended;
  selectedSuperset: Superset;
  setSelectedSuperset: SetState<Superset | undefined>;
  setIndex: number;
  isUnilateral: boolean;
  showOptions?: boolean;
  showDoneCheckbox?: boolean;
}

export default function TrainingInProgressExerciseSet(props: Props) {
  const { trainingInProgress, updateTrainingInProgress } = useTraining();

  const {
    set,
    exercise,
    setIndex: index,
    isUnilateral,
    showOptions,
    showDoneCheckbox,
  } = props;

  if (!trainingInProgress) return null;

  const uni = exercise.exercise?.isUnilateral;
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);
  const supersetIndex = exercise.supersetIndex;

  return (
    <Box width="100%" display="flex" alignItems="center">
      <Grid2 size={0.5}>
        {isUnilateral && (
          <Box
            display="flex"
            flexDirection="column"
            gap={1}
            justifyContent="end"
            height={index === 0 || showOptions ? 80 : 55}
          >
            <LeftRightExerciseText title="L" />
            <LeftRightExerciseText title="R" />
          </Box>
        )}

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
              showOptions={index === 0}
              disable
              disableOptions
            />

            <NumberExerciseParam
              options={[REPS, DIST, TIME]}
              selected={volType}
              value={exercise.sets[index]?.[volType] as number}
              exercise={exercise}
              showOptions={index === 0}
              disableOptions
              onInputChange={(value) => {
                exercise.sets[index][volType] = +value;
                updateTrainingInProgress(exercise, supersetIndex || 0);
              }}
            />

            <NumberExerciseParam
              options={[KG]}
              selected={KG.field} // always in kg
              value={exercise.sets[index]?.loadKg || 0}
              exercise={exercise}
              showOptions={index === 0}
              disableOptions
              onInputChange={(value) => {
                exercise.sets[index].loadKg = +value;
                updateTrainingInProgress(exercise, supersetIndex || 0);
              }}
            />

            {effType === 'tempo' ? (
              <TempoExerciseParam
                options={[TEMPO, EFF]}
                selected={effType}
                value={exercise.sets[0]?.[effType] || ''}
                exercise={exercise}
                showOptions={index === 0}
                disableOptions
                onInputChange={(value) => {
                  if (effType === 'tempo')
                    exercise.sets[index].tempo = value.toString();
                  else exercise.sets[index].eff = +value;

                  updateTrainingInProgress(exercise, supersetIndex || 0);
                }}
              />
            ) : (
              <NumberExerciseParam
                options={[TEMPO, EFF]}
                selected={effType}
                value={exercise.sets[0]?.[effType] || 0}
                showOptions
                exercise={exercise}
                disableOptions
                onInputChange={(value) => {
                  exercise.sets[index].eff = +value;
                  updateTrainingInProgress(exercise, supersetIndex || 0);
                }}
              />
            )}

            <NumberExerciseParam
              options={[REC_TIME, REC_DIST]}
              selected={recType}
              value={exercise.sets[index]?.[recType] as number}
              exercise={exercise}
              showOptions={index === 0}
              disableOptions
              onInputChange={(value) => {
                exercise.sets[index][recType] = +value;
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
                options={[REPS, DIST, TIME]}
                selected={volType}
                value={
                  volType === 'reps'
                    ? exercise.sets[index]?.repsR || 0
                    : exercise.sets[index]?.[volType] || 0 // dist and time are the same for both sides
                }
                exercise={exercise}
                showOptions={false}
                onInputChange={(value) => {
                  const field = volType === 'reps' ? 'repsR' : volType;
                  exercise.sets[index][field] = +value;
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

              {effType === 'tempo' ? (
                <TempoExerciseParam
                  options={[TEMPO, EFF]}
                  selected={effType}
                  value={
                    effType === 'tempo'
                      ? exercise.sets[index]?.tempoR || ''
                      : exercise.sets[index]?.eff || 0
                  }
                  exercise={exercise}
                  showOptions={false}
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[index].tempoR = value.toString();
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              ) : (
                <NumberExerciseParam
                  options={[TEMPO, EFF]}
                  selected={effType}
                  value={exercise.sets[0]?.[effType] || 0}
                  showOptions
                  exercise={exercise}
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[index].eff = +value;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )}

              <NumberExerciseParam
                options={[REC_TIME, REC_DIST]}
                selected={recType}
                value={exercise.sets[index]?.[recType] as number}
                exercise={exercise}
                showOptions={false}
                disableOptions
                onInputChange={(value) => {
                  exercise.sets[index][recType] = +value;
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
