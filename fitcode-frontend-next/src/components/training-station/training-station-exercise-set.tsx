import { Box, Divider, Grid } from '@mui/material';
import { useEffect, useState } from 'react';

import { NumberExerciseParam } from '../exercise-param/number-exercise-param';
import { TempoExerciseParam } from '../exercise-param/tempo-exercise-param';
import UnilateralParamsRow from '../training-in-progress/unilateral-params-row';
import { getSupersetIndex } from './actions/actions-superset-index';
import { theme } from '@/app/style';
import { core } from '@/core/core.service';
import { KG } from '@/core/exercise/constant/exercise-param.constant';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { Workload } from '@/core/training/type/workload.type';
import { useCoachTrainingStation } from '@/store/training-station.provider';
import LeftRightExerciseText from '@/ui/left-right-exercise-text';

interface Props {
  exercise: TrainingExercise; // already correctly selected exercise based on selectedUser
}

export default function TrainingStationExerciseSet(props: Props) {
  const {
    selectedUser,
    individualTrainings,
    selectedSetIndex: setIndex,
    selectedExercise,
    component,
    workloads,
    updateStationsWorkloadValue,
  } = useCoachTrainingStation();

  const { exercise } = props;

  const individualTraining = individualTrainings.find(
    (it) => it.userId === selectedUser?.uid
  )!;

  const [foundWorkload, setFoundWorkload] = useState<Workload | undefined>(
    undefined
  );

  console.log('workloads', workloads);

  useEffect(() => {
    if (
      setIndex === undefined ||
      !component ||
      !selectedUser ||
      !individualTraining
    )
      return;

    const newFoundWorkload = workloads.find((wl) => {
      return (
        wl.trainingId === individualTraining.id &&
        wl.componentId === component.id &&
        wl.exerciseId === exercise.id &&
        wl.setNumber === setIndex + 1 &&
        wl.userId === selectedUser.uid
      );
    });

    setFoundWorkload(newFoundWorkload);
  }, [selectedUser, selectedExercise, setIndex, workloads]);

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

  if (
    setIndex === undefined ||
    !component ||
    !selectedUser ||
    !individualTraining
  )
    return null;

  return (
    <>
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
                const supersetIndex = getSupersetIndex(
                  individualTraining,
                  component.id,
                  exercise.id
                );

                if (supersetIndex === null) return;

                updateStationsWorkloadValue(
                  {
                    trainingId: individualTraining.id,
                    componentId: component.id,
                    exerciseId: exercise.id,
                    supersetIndex: supersetIndex || 0,
                    setNumber: setIndex + 1,
                    userId: selectedUser.uid,
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
                const supersetIndex = getSupersetIndex(
                  individualTraining,
                  component.id,
                  exercise.id
                );

                if (supersetIndex === null) return;

                updateStationsWorkloadValue(
                  {
                    trainingId: individualTraining.id,
                    componentId: component.id,
                    exerciseId: exercise.id,
                    supersetIndex: supersetIndex || 0,
                    setNumber: setIndex + 1,
                    userId: selectedUser.uid,
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
                const supersetIndex = getSupersetIndex(
                  individualTraining,
                  component.id,
                  exercise.id
                );

                if (supersetIndex === null) return;

                updateStationsWorkloadValue(
                  {
                    trainingId: individualTraining.id,
                    componentId: component.id,
                    exerciseId: exercise.id,
                    supersetIndex: supersetIndex || 0,
                    setNumber: setIndex + 1,
                    userId: selectedUser.uid,
                  },
                  KG.field,
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
              foundWorkload?.[recType] !== undefined &&
              typeof foundWorkload?.[recType] === 'number'
                ? (foundWorkload?.[recType] as number)
                : (exercise.sets[setIndex][recType] ?? 0)
            }
            exercise={exercise}
            disableOptions
            disable
            trainingInProgressSecondaryItem
            renderIconOnly={!uni}
            showOptions={!uni}
            onInputChange={(value) => {
              const supersetIndex = getSupersetIndex(
                individualTraining,
                component.id,
                exercise.id
              );

              if (supersetIndex === null) return;

              updateStationsWorkloadValue(
                {
                  trainingId: individualTraining.id,
                  componentId: component.id,
                  exerciseId: exercise.id,
                  supersetIndex: supersetIndex || 0,
                  setNumber: setIndex + 1,
                  userId: selectedUser.uid,
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
          <Grid container spacing={0.5} columns={11}>
            <Grid size={0.75} />
            <Grid size={9.5}></Grid>
            <UnilateralParamsRow
              params={params}
              load={load}
              volParam={volParam}
              loadParam={loadParam}
            />
            <Grid size={0.75} />
          </Grid>

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
                      foundWorkload?.[core.exercise.param.pairs[effType]] !==
                        undefined &&
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

                      const supersetIndex = getSupersetIndex(
                        individualTraining,
                        component.id,
                        exercise.id
                      );

                      if (supersetIndex === null) return;

                      updateStationsWorkloadValue(
                        {
                          trainingId: individualTraining.id,
                          componentId: component.id,
                          exerciseId: exercise.id,
                          supersetIndex: supersetIndex || 0,
                          setNumber: setIndex + 1,
                          userId: selectedUser.uid,
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

                    const supersetIndex = getSupersetIndex(
                      individualTraining,
                      component.id,
                      exercise.id
                    );

                    if (supersetIndex === null) return;

                    updateStationsWorkloadValue(
                      {
                        trainingId: individualTraining.id,
                        componentId: component.id,
                        exerciseId: exercise.id,
                        supersetIndex: supersetIndex || 0,
                        setNumber: setIndex + 1,
                        userId: selectedUser.uid,
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

                    const supersetIndex = getSupersetIndex(
                      individualTraining,
                      component.id,
                      exercise.id
                    );

                    if (supersetIndex === null) return;

                    updateStationsWorkloadValue(
                      {
                        trainingId: individualTraining.id,
                        componentId: component.id,
                        exerciseId: exercise.id,
                        supersetIndex: supersetIndex || 0,
                        setNumber: setIndex + 1,
                        userId: selectedUser.uid,
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
                  typeof foundWorkload?.[core.exercise.param.pairs[recType]] ===
                    'number'
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

                  const supersetIndex = getSupersetIndex(
                    individualTraining,
                    component.id,
                    exercise.id
                  );

                  if (supersetIndex === null) return;

                  updateStationsWorkloadValue(
                    {
                      trainingId: individualTraining.id,
                      componentId: component.id,
                      exerciseId: exercise.id,
                      supersetIndex: supersetIndex || 0,
                      setNumber: setIndex + 1,
                      userId: selectedUser.uid,
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
    </>
  );
}
