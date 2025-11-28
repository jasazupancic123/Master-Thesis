import { Box, Grid2 } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import TrainingExerciseSetDoneCheckbox from './training-exercise-set-done-checkbox';
import { core } from '@/core/core.service';
import { KG, SETS } from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExerciseExtended } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainings } from '@/store/trainings.provider';
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

export default function UndoneExerciseSet(props: Props) {
  const screenSize = useScreenSize();

  const { trainingInProgress, updateTrainingInProgress } = useTrainings();

  const {
    set,
    exercise,
    setIndex: index,
    showOptions,
    showDoneCheckbox,
  } = props;

  if (!trainingInProgress) return null;

  const uni = exercise.exercise?.isUnilateral;
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);
  const supersetIndex = exercise.supersetIndex;

  const volOptions = core.training.set.getVolOptions(exercise.exercise!);
  const effOptions = core.training.set.getEffOptions(exercise.exercise!);
  const recOptions = core.training.set.getRecOptions(exercise.exercise!);

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
            mt={showOptions ? 3.8 : 0.5}
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
              selected={SETS.field as string}
              value={set.setNumber}
              exercise={exercise}
              showOptions={showOptions}
              disable
              disableOptions
            />

            {volType && volOptions.length > 0 && (
              <NumberExerciseParam
                options={volOptions}
                selected={volType}
                value={exercise.sets[index]?.[volType] as number}
                exercise={exercise}
                showOptions={showOptions}
                disableOptions
                onInputChange={(value) => {
                  exercise.sets[index][volType] = +value;
                  updateTrainingInProgress(exercise, supersetIndex || 0);
                }}
              />
            )}

            {exercise.sets[index]?.[KG.field] !== undefined && (
              <NumberExerciseParam
                options={[KG]}
                selected={KG.field} // always in kg
                value={exercise.sets[index]?.[KG.field] || 0}
                exercise={exercise}
                showOptions={showOptions}
                disableOptions
                onInputChange={(value) => {
                  exercise.sets[index][KG.field] = +value as never;
                  updateTrainingInProgress(exercise, supersetIndex || 0);
                }}
              />
            )}

            {effType && effOptions.length > 0 ? (
              effType === 'tempoEcc' ? (
                <TempoExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={core.training.set.getTempo(exercise.sets[index])}
                  exercise={exercise}
                  showOptions={showOptions}
                  disableOptions
                  onInputChange={(values) => {
                    core.training.set.setTempo(
                      exercise.sets[index],
                      values as [number, number, number, number]
                    );

                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              ) : (
                <NumberExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={exercise.sets[index]?.[effType] || 0}
                  showOptions
                  exercise={exercise}
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[index][effType] = +value;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )
            ) : null}

            {recType && recOptions.length > 0 && (
              <NumberExerciseParam
                options={recOptions}
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
            )}
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
                selected={SETS.field as string}
                value={set.setNumber}
                exercise={exercise}
                showOptions={false}
                disable
                disableOptions
              />

              {volType && volOptions.length > 0 && (
                <NumberExerciseParam
                  options={volOptions}
                  selected={volType}
                  value={
                    exercise.sets[index]?.[
                      core.exercise.param.pairs[volType]
                    ] || 0
                  }
                  exercise={exercise}
                  showOptions={false}
                  onInputChange={(value) => {
                    const field = core.exercise.param.pairs[volType];
                    exercise.sets[index][field] = +value as never;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )}

              {exercise.sets[index]?.[KG.field] !== undefined && (
                <NumberExerciseParam
                  options={[KG]}
                  selected={KG.field}
                  value={
                    exercise.sets[index]?.[
                      core.exercise.param.pairs['loadKg']
                    ] || 0
                  }
                  exercise={exercise}
                  showOptions={false}
                  disableOptions
                  onInputChange={(value) => {
                    const field = core.exercise.param.pairs['loadKg'];
                    exercise.sets[index][field] = +value;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )}

              {effOptions.length > 0 &&
                (effType === 'tempoEcc' ? (
                  <TempoExerciseParam
                    options={effOptions}
                    selected={effType}
                    value={core.training.set.getTempoR(exercise.sets[index])}
                    exercise={exercise}
                    showOptions={false}
                    disableOptions
                    onInputChange={(values) => {
                      core.training.set.setTempoR(
                        exercise.sets[index],
                        values as [number, number, number, number]
                      );

                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                ) : (
                  <NumberExerciseParam
                    options={effOptions}
                    selected={effType!}
                    value={
                      exercise.sets[index]?.[
                        core.exercise.param.pairs[effType!]
                      ] || 0
                    }
                    showOptions
                    exercise={exercise}
                    disableOptions
                    onInputChange={(value) => {
                      const field = core.exercise.param.pairs[effType!];
                      exercise.sets[index][field] = +value as never;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                ))}

              {recType && recOptions.length > 0 && (
                <NumberExerciseParam
                  options={recOptions}
                  selected={recType}
                  value={
                    exercise.sets[index]?.[
                      core.exercise.param.pairs[recType]
                    ] as number
                  }
                  exercise={exercise}
                  showOptions={false}
                  disableOptions
                  onInputChange={(value) => {
                    const field = core.exercise.param.pairs[recType];
                    exercise.sets[index][field] = +value as never;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )}
            </Box>
          )}
        </Grid2>
      </Grid2>

      {showDoneCheckbox && (
        <TrainingExerciseSetDoneCheckbox
          exercise={exercise}
          setIndex={set.setNumber - 1}
          supersetIndex={supersetIndex!}
        />
      )}
    </Box>
  );
}
