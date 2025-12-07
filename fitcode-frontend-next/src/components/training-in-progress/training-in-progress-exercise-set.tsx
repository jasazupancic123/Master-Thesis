import { Box, Divider, Grid2 } from '@mui/material';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import TrainingExerciseSetDoneCheckbox from './training-exercise-set-done-checkbox';
import UnilateralParamsRow from './unilateral-params-row';
import { theme } from '@/app/style';
import { core } from '@/core/core.service';
import { KG } from '@/core/exercise/constant/exercise-param.constant';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
  exercise: TrainingExercise;
  setIndex: number;
}

export default function TrainingInProgressExerciseSet(props: Props) {
  const { user } = useAuthenticatedAuth();

  const { trainingInProgress } = useTrainings();

  const { supersetIndex, selectedExercise, workloads, updateWorkloadValue } =
    useTrainingInProgress();

  const { exercise, setIndex } = props;

  if (!selectedExercise || supersetIndex === undefined) return null;

  const foundWorkload = workloads.find((wl) => {
    return (
      wl.trainingId === trainingInProgress?.training.id &&
      wl.componentId === trainingInProgress?.componentId &&
      wl.exerciseId === exercise.id &&
      wl.supersetIndex === supersetIndex &&
      wl.setNumber === setIndex + 1
    );
  });

  const uni = exercise.exercise?.isUnilateral;
  const volType = core.training.set.getVolType(exercise.sets[0]);
  const effType = core.training.set.getEffType(exercise.sets[0]);
  const recType = core.training.set.getRecType(exercise.sets[0]);
  const load = foundWorkload?.loadKg ?? exercise.sets[setIndex || 0].loadKg;

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
                    foundWorkload || exercise.sets[setIndex],
                    true
                  )}
                  exercise={exercise}
                  disableOptions
                  disabled
                  trainingInProgressSecondaryItem
                  showOptions={!uni}
                  onInputChange={(_) => {
                    // We currently don't allow updating the tempo manually
                  }}
                />
              ) : (
                <NumberExerciseParam
                  options={effOptions}
                  selected={effType}
                  value={
                    foundWorkload?.[effType] !== undefined
                      ? foundWorkload?.[effType]
                      : (exercise.sets[setIndex]?.[effType] ?? 0)
                  }
                  exercise={exercise}
                  showOptions={!uni}
                  disableOptions
                  trainingInProgressSecondaryItem
                  disable
                  onInputChange={(value) => {
                    updateWorkloadValue(
                      {
                        userId: user.uid,
                        trainingId: trainingInProgress.training.id,
                        componentId: trainingInProgress.componentId,
                        exerciseId: exercise.id,
                        supersetIndex: supersetIndex || 0,
                        setNumber: setIndex + 1,
                      },
                      effType,
                      +value
                    );
                  }}
                  setIndex={setIndex}
                />
              )
            ) : null}
            <Box display="flex" alignItems="center">
              {volParam && (
                <NumberExerciseParam
                  options={volOptions}
                  selected={volType}
                  value={
                    foundWorkload?.[volType] !== undefined
                      ? foundWorkload?.[volType]
                      : (exercise.sets[setIndex]?.[volType] ?? 0)
                  }
                  exercise={exercise}
                  showOptions={!uni}
                  trainingInProgressPrimaryItem
                  disableOptions
                  onInputChange={(value) => {
                    updateWorkloadValue(
                      {
                        userId: user.uid,
                        trainingId: trainingInProgress.training.id,
                        componentId: trainingInProgress.componentId,
                        exerciseId: exercise.id,
                        supersetIndex: supersetIndex || 0,
                        setNumber: setIndex + 1,
                      },
                      volType,
                      +value
                    );
                  }}
                  setIndex={setIndex}
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
                    foundWorkload?.[KG.field] !== undefined &&
                    typeof foundWorkload?.[KG.field] === 'number'
                      ? (foundWorkload?.[KG.field] as number)
                      : (exercise.sets[setIndex]?.[KG.field] ?? 0)
                  }
                  exercise={exercise}
                  showOptions={!uni}
                  trainingInProgressPrimaryItem
                  disableOptions
                  onInputChange={(value) => {
                    updateWorkloadValue(
                      {
                        userId: user.uid,
                        trainingId: trainingInProgress.training.id,
                        componentId: trainingInProgress.componentId,
                        exerciseId: exercise.id,
                        supersetIndex: supersetIndex || 0,
                        setNumber: setIndex + 1,
                      },
                      KG.field,
                      +value
                    );
                  }}
                  setIndex={setIndex}
                />
              )}
            </Box>
            ;
            {recParam && (
              <NumberExerciseParam
                options={recOptions}
                selected={recType}
                value={
                  foundWorkload?.[recType] !== undefined
                    ? foundWorkload?.[recType]
                    : (exercise.sets[setIndex][recType] ?? 0)
                }
                exercise={exercise}
                disableOptions
                disable
                trainingInProgressSecondaryItem
                renderIconOnly={!uni}
                showOptions={!uni}
                onInputChange={(value) => {
                  updateWorkloadValue(
                    {
                      userId: user.uid,
                      trainingId: trainingInProgress.training.id,
                      componentId: trainingInProgress.componentId,
                      exerciseId: exercise.id,
                      supersetIndex: supersetIndex || 0,
                      setNumber: setIndex + 1,
                    },
                    recType,
                    +value
                  );
                }}
                setIndex={setIndex}
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
                          foundWorkload || exercise.sets[setIndex],
                          true
                        )}
                        exercise={exercise}
                        disableOptions
                        disabled
                        trainingInProgressSecondaryItem
                        showOptions={false}
                        onInputChange={(_) => {
                          // We currently don't allow updating the tempo manually
                        }}
                      />
                    ) : (
                      <NumberExerciseParam
                        options={effOptions}
                        selected={effType}
                        value={
                          foundWorkload?.[
                            core.exercise.param.pairs[effType]
                          ] !== undefined &&
                          typeof foundWorkload?.[
                            core.exercise.param.pairs[effType]
                          ] === 'number'
                            ? (foundWorkload?.[
                                core.exercise.param.pairs[effType]
                              ] as number)
                            : (exercise.sets[setIndex]?.[
                                core.exercise.param.pairs[effType]
                              ] ?? 0)
                        }
                        exercise={exercise}
                        showOptions={false}
                        disableOptions
                        disable
                        trainingInProgressSecondaryItem
                        onInputChange={(value) => {
                          const field = core.exercise.param.pairs[effType];

                          updateWorkloadValue(
                            {
                              userId: user.uid,
                              trainingId: trainingInProgress.training.id,
                              componentId: trainingInProgress.componentId,
                              exerciseId: exercise.id,
                              supersetIndex: supersetIndex || 0,
                              setNumber: setIndex + 1,
                            },
                            field,
                            +value
                          );
                        }}
                        setIndex={setIndex}
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
                        foundWorkload?.[core.exercise.param.pairs[volType]] !==
                          undefined &&
                        typeof foundWorkload?.[
                          core.exercise.param.pairs[volType]
                        ] === 'number'
                          ? (foundWorkload?.[
                              core.exercise.param.pairs[volType]
                            ] as number)
                          : (exercise.sets[setIndex]?.[
                              core.exercise.param.pairs[volType]
                            ] ?? 0)
                      }
                      trainingInProgressPrimaryItem
                      disableOptions
                      exercise={exercise}
                      showOptions={false}
                      onInputChange={(value) => {
                        const field = core.exercise.param.pairs[
                          volType
                        ] as typeof volType;

                        updateWorkloadValue(
                          {
                            userId: user.uid,
                            trainingId: trainingInProgress.training.id,
                            componentId: trainingInProgress.componentId,
                            exerciseId: exercise.id,
                            supersetIndex: supersetIndex || 0,
                            setNumber: setIndex + 1,
                          },
                          field,
                          +value
                        );
                      }}
                      setIndex={setIndex}
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
                        foundWorkload?.[core.exercise.param.pairs['loadKg']] !==
                          undefined &&
                        typeof foundWorkload?.[
                          core.exercise.param.pairs['loadKg']
                        ] === 'number'
                          ? (foundWorkload?.[
                              core.exercise.param.pairs['loadKg']
                            ] as number)
                          : (exercise.sets[setIndex]?.[
                              core.exercise.param.pairs['loadKg']
                            ] ?? 0)
                      }
                      exercise={exercise}
                      showOptions={false}
                      trainingInProgressPrimaryItem
                      disableOptions
                      onInputChange={(value) => {
                        const field = core.exercise.param.pairs['loadKg'];

                        updateWorkloadValue(
                          {
                            userId: user.uid,
                            trainingId: trainingInProgress.training.id,
                            componentId: trainingInProgress.componentId,
                            exerciseId: exercise.id,
                            supersetIndex: supersetIndex || 0,
                            setNumber: setIndex + 1,
                          },
                          field,
                          +value
                        );
                      }}
                      setIndex={setIndex}
                    />
                  )}
                </Box>
                {recParam && (
                  <NumberExerciseParam
                    options={recOptions}
                    selected={recType}
                    value={
                      foundWorkload?.[core.exercise.param.pairs[recType]] !==
                        undefined &&
                      typeof foundWorkload?.[
                        core.exercise.param.pairs[recType]
                      ] === 'number'
                        ? (foundWorkload?.[
                            core.exercise.param.pairs[recType]
                          ] as number)
                        : (exercise.sets[setIndex][
                            core.exercise.param.pairs[recType]
                          ] ?? 0)
                    }
                    exercise={exercise}
                    showOptions={false}
                    disableOptions
                    disable
                    trainingInProgressSecondaryItem
                    onInputChange={(value) => {
                      const field = core.exercise.param.pairs[recType];

                      updateWorkloadValue(
                        {
                          userId: user.uid,
                          trainingId: trainingInProgress.training.id,
                          componentId: trainingInProgress.componentId,
                          exerciseId: exercise.id,
                          supersetIndex: supersetIndex || 0,
                          setNumber: setIndex + 1,
                        },
                        field,
                        +value
                      );
                    }}
                    setIndex={setIndex}
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
