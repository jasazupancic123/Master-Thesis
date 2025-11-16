import { Box, Divider, Grid2 } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import TrainingExerciseSetDoneCheckbox from './training-exercise-set-done-checkbox';
import UnilateralParamsRow from './unilateral-params-row';
import { theme } from '@/app/style';
import { core } from '@/core/core.service';
import { KG } from '@/core/exercise/constant/exercise-param.constant';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
  exercise: TrainingExercise;
  setIndex: number;
}

export default function TrainingInProgressExerciseSet(props: Props) {
  const { activeTraining } = useMain();

  const { trainingInProgress, updateTrainingInProgress } = useTraining();

  const { supersetIndex, selectedExercise } = useTrainingInProgress();

  const { exercise, setIndex } = props;

  if (!selectedExercise || supersetIndex === undefined || !activeTraining)
    return null;

  const uni = exercise.exercise?.isUnilateral;
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);
  const load = exercise.sets[setIndex || 0].loadKg;

  const volOptions = core.training.set.getVolOptions(exercise.exercise!);
  const intOptions = core.training.set.getIntOptions(exercise.exercise!);
  const effOptions = core.training.set.getEffOptions(exercise.exercise!);
  const recOptions = core.training.set.getRecOptions(exercise.exercise!);

  const volParam = volType && volOptions.length > 0;
  const loadParam = load !== undefined && intOptions.length > 0;
  const effTempoParam = effType && effOptions.length > 0;
  const recParam = recType && recOptions.length > 0;

  const params = [effType, volType, load, recType].filter(
    (p) => p !== undefined
  );

  if (!trainingInProgress) return null;

  const isSetCompleted = ExerciseSetService.isSetCompleted(
    {
      trainingId: trainingInProgress.training.id,
      componentId: trainingInProgress.selectedComponent.id,
      exerciseId: selectedExercise.id,
      supersetIndex: supersetIndex,
      setIndex: setIndex,
    },
    activeTraining.workloads
  );

  return (
    <Box
      id="athlete-training-exercise-sets-container"
      display="flex"
      flexDirection="column"
      width="100%"
      gap={0.9}
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Grid2 container spacing={0.5} columns={11}>
        <Grid2 size={0.75} />

        <Grid2 size={9.5}>
          <Box
            display="flex"
            width="100%"
            justifyContent="center"
            alignItems={uni ? 'center' : 'flex-start'}
            gap={1}
            sx={{
              position: uni ? 'relative' : undefined,
              pr: uni ? 5 : undefined,
            }}
          >
            {uni && (
              <Box width={8} sx={{ mr: 3 }}>
                <LeftRightExerciseText title="L" />
              </Box>
            )}

            {effTempoParam ? (
              effType === 'tempoEcc' ? (
                <TempoExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={core.training.set.getTempo(
                    exercise.sets[setIndex],
                    true
                  )}
                  exercise={exercise}
                  disableOptions
                  disabled
                  trainingInProgressSecondaryItem
                  showOptions={!uni}
                  onInputChange={(values) => {
                    core.training.set.setTempo(
                      exercise.sets[setIndex],
                      values as [number, number, number, number]
                    );

                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              ) : (
                <NumberExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={exercise.sets[setIndex]?.[effType] || 0}
                  exercise={exercise}
                  showOptions={!uni}
                  disableOptions
                  trainingInProgressSecondaryItem
                  disable
                  onInputChange={(value) => {
                    exercise.sets[setIndex][effType] = +value;
                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )
            ) : null}

            <Box display="flex" alignItems="center">
              {volParam && (
                <NumberExerciseParam
                  options={volOptions}
                  selected={volType}
                  value={exercise.sets[setIndex]?.[volType] || 0}
                  exercise={exercise}
                  showOptions={!uni}
                  trainingInProgressPrimaryItem
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[setIndex][volType] = +value;

                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )}

              {volParam && loadParam && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 30,
                    mx: 1,
                    my: 'auto',
                    borderColor: theme.palette.text.primary,
                  }}
                />
              )}

              {loadParam && (
                <NumberExerciseParam
                  options={[KG]}
                  selected={KG.field}
                  value={exercise.sets[setIndex]?.[KG.field] || 0}
                  exercise={exercise}
                  showOptions={!uni}
                  trainingInProgressPrimaryItem
                  disableOptions
                  onInputChange={(value) => {
                    exercise.sets[setIndex][KG.field] = +value as never;

                    updateTrainingInProgress(exercise, supersetIndex || 0);
                  }}
                />
              )}
            </Box>

            {recParam && (
              <NumberExerciseParam
                options={recOptions}
                selected={recType}
                value={exercise.sets[setIndex][recType] || 0}
                exercise={exercise}
                disableOptions
                disable
                trainingInProgressSecondaryItem
                renderIconOnly={!uni}
                showOptions={!uni}
                onInputChange={(value) => {
                  exercise.sets[setIndex][recType] = +value;
                  updateTrainingInProgress(exercise, supersetIndex || 0);
                }}
              />
            )}
          </Box>

          {uni && (
            <>
              <Grid2 container spacing={0.5} columns={11}>
                <Grid2 size={0.75} />
                <Grid2 size={9.5}></Grid2>
                <UnilateralParamsRow
                  params={params}
                  load={load}
                  volParam={volParam}
                  loadParam={loadParam}
                />
                <Grid2 size={0.75} />
              </Grid2>

              <Box
                display="flex"
                width="100%"
                justifyContent="center"
                alignItems="center"
                gap={1}
                mt={0.5}
                sx={{
                  pr: uni ? 5 : undefined,
                }}
              >
                {uni && (
                  <Box width={8} sx={{ mr: 3 }}>
                    <LeftRightExerciseText title="R" />
                  </Box>
                )}

                {effTempoParam ? (
                  <>
                    {effType === 'tempoEcc' ? (
                      <TempoExerciseParam
                        options={effOptions}
                        selected={effType}
                        value={core.training.set.getTempoR(
                          exercise.sets[setIndex],
                          true
                        )}
                        exercise={exercise}
                        disableOptions
                        disabled
                        trainingInProgressSecondaryItem
                        showOptions={false}
                        onInputChange={(values) => {
                          core.training.set.setTempo(
                            exercise.sets[setIndex],
                            values as [number, number, number, number]
                          );

                          updateTrainingInProgress(
                            exercise,
                            supersetIndex || 0
                          );
                        }}
                      />
                    ) : (
                      <NumberExerciseParam
                        options={effOptions}
                        selected={effType}
                        value={
                          exercise.sets[setIndex]?.[
                            core.exercise.param.pairs[effType]
                          ] || 0
                        }
                        exercise={exercise}
                        showOptions={false}
                        disableOptions
                        disable
                        trainingInProgressSecondaryItem
                        onInputChange={(value) => {
                          const field = core.exercise.param.pairs[effType];
                          exercise.sets[setIndex][field] = +value as never;
                          updateTrainingInProgress(
                            exercise,
                            supersetIndex || 0
                          );
                        }}
                      />
                    )}
                  </>
                ) : null}

                <Box display="flex" alignItems="center">
                  {volParam && (
                    <NumberExerciseParam
                      options={volOptions}
                      selected={volType}
                      value={
                        exercise.sets[setIndex]?.[
                          core.exercise.param.pairs[volType]
                        ] as number
                      }
                      trainingInProgressPrimaryItem
                      disableOptions
                      exercise={exercise}
                      showOptions={false}
                      onInputChange={(value) => {
                        const field = core.exercise.param.pairs[
                          volType
                        ] as typeof volType;

                        exercise.sets[setIndex][field] = +value;
                        updateTrainingInProgress(exercise, supersetIndex || 0);
                      }}
                    />
                  )}

                  {volParam && loadParam && (
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        height: 30,
                        mx: 1,
                        my: 'auto',
                        borderColor: theme.palette.text.primary,
                      }}
                    />
                  )}

                  {loadParam && (
                    <NumberExerciseParam
                      options={[KG]}
                      selected={KG.field}
                      value={
                        exercise.sets[setIndex]?.[
                          core.exercise.param.pairs['loadKg']
                        ] || 0
                      }
                      exercise={exercise}
                      showOptions={false}
                      trainingInProgressPrimaryItem
                      disableOptions
                      onInputChange={(value) => {
                        const field = core.exercise.param.pairs['loadKg'];
                        exercise.sets[setIndex][field] = +value;
                        updateTrainingInProgress(exercise, supersetIndex || 0);
                      }}
                    />
                  )}
                </Box>

                {recParam && (
                  <NumberExerciseParam
                    options={recOptions}
                    selected={recType}
                    value={
                      exercise.sets[setIndex][
                        core.exercise.param.pairs[recType]
                      ] || 0
                    }
                    exercise={exercise}
                    showOptions={false}
                    disableOptions
                    disable
                    trainingInProgressSecondaryItem
                    onInputChange={(value) => {
                      const field = core.exercise.param.pairs[recType];
                      exercise.sets[setIndex][field] = +value;
                      updateTrainingInProgress(exercise, supersetIndex || 0);
                    }}
                  />
                )}
              </Box>
            </>
          )}
        </Grid2>

        <Grid2 size={0.75}>
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
          >
            <TrainingExerciseSetDoneCheckbox
              exercise={exercise}
              setIndex={setIndex}
              supersetIndex={supersetIndex}
            />
          </Box>
        </Grid2>
      </Grid2>
    </Box>
  );
}
