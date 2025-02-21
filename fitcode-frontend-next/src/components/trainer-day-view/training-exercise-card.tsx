import {
  RECOVERY,
  SET,
  SET_TYPE,
  TEMPO,
  WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { useGroup } from '@/context/group-provider';
import { ExerciseMeta } from '@/controller/training/type/training-plan.type';
import { Box, Grid2, IconButton, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { SetExerciseAttribute } from './exercise-card-set-attribute';
import { TrainingExerciseCardProps } from './props';
import { handleDeleteExercise } from './state';
import DeleteIcon from '@mui/icons-material/Delete';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const {
    exercise,
    supersetIndex: j,
    selectedExercise,
    setSelectedExercise,
  } = props;
  const {
    training,
    setTraining,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    filteredTrainings,
    setFilteredTrainings,
    setComponent,
    selectedAthlete,
    setDetectedChanges,
  } = useGroup();

  const i = training?.components.findIndex((c) => c.id === component?.id);
  const selectedTrainingOrSubgroup =
    selectedSubgroup?.subgroup || training?.components?.[i!];
  const k = selectedTrainingOrSubgroup?.supersets?.[j!]?.exercises?.findIndex(
    (e) => e.id === exercise.id
  );

  const state =
    selectedTrainingOrSubgroup?.supersets?.[j!]?.exercises?.[k!]?.meta;
  const [tempoOrEffort, setTempoOrEffort] = useState<'temp' | 'eff'>(
    !state || state?.tempo ? 'temp' : 'eff'
  );

  function updateSelectedTraining(
    pairs: { field: keyof ExerciseMeta; value: string | number }[]
  ) {
    setTraining((training) => {
      if (!training) return undefined;

      const updatedTraining = { ...training };
      for (const { field, value } of pairs)
        (updatedTraining.components[i!].supersets[j!].exercises[k!].meta[
          field
        ] as any) = value;

      return updatedTraining;
    });
    setDetectedChanges(true);
  }

  if (!training || !component || !state) return null;

  return (
    <Stack
      spacing={1}
      p={1}
      pb={3}
      sx={{
        my: -1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Stack
        direction="row"
        justifyContent="center"
        sx={{
          cursor:
            selectedExercise !== exercise && selectedAthlete
              ? 'pointer'
              : undefined,
        }}
        onClick={() => {
          if (selectedAthlete) setSelectedExercise(exercise);
        }}
      >
        <Typography
          variant="body1"
          fontWeight="bold"
          fontSize={14}
          textTransform="uppercase"
          sx={{ color: '#bcb4b1', textAlign: 'center' }}
        >
          {exercise.exercise?.name}
        </Typography>
      </Stack>

      <Grid2 container spacing={1} columns={10}>
        {/* Sets */}
        <Grid2 size={{ xs: 5, sm: 3.33, lg: 2 }}>
          <SetExerciseAttribute
            options={SET}
            state={(() => {
              const option = SET.find((option) => option.label === 'sets')!;
              return {
                type: option.type,
                label: option.label,
                values: option.values,
                option: option.label as keyof ExerciseMeta,
                format: option.format,
                value: state.sets.toString() ?? option.values![1].toString(),
              };
            })()}
            onChange={(state) => {
              const sets = parseInt(state.value);
              updateSelectedTraining([{ field: 'sets', value: sets }]);
            }}
          />
        </Grid2>

        {/* Set Type */}
        <Grid2 size={{ xs: 5, sm: 3.33, lg: 2 }}>
          <SetExerciseAttribute
            options={SET_TYPE}
            state={(() => {
              const option = SET_TYPE.find(
                (option) => option.label === state.setType
              )!;

              return {
                type: option.type,
                label: option.label,
                values: option.values,
                option: option.label as keyof ExerciseMeta,
                format: option.format,
                value:
                  state.setTypeValue.toString() ?? option.values![1].toString(),
              };
            })()}
            onChange={(state) => {
              const setType = state.option as ExerciseMeta['setType'];
              const setTypeValue = parseInt(state.value);

              updateSelectedTraining([
                { field: 'setType', value: setType },
                {
                  field: 'setTypeValue',
                  value: isNaN(setTypeValue) ? 5 : setTypeValue,
                }, // 5 because all set type options include 5
              ]);
            }}
          />
        </Grid2>

        {/* Workload */}
        <Grid2 size={{ xs: 5, sm: 3.33, lg: 2 }}>
          <SetExerciseAttribute
            options={WORKLOAD}
            state={(() => {
              const option = WORKLOAD.find(
                (option) => option.label === state.workloadType
              )!;

              return {
                type: option.type,
                label: option.label,
                values: option.values,
                option: option.label as keyof ExerciseMeta,
                format: option.format,
                value: (state.workloadValue || 10).toString(),
              };
            })()}
            onChange={(state) => {
              const workloadType = state.option as ExerciseMeta['workloadType'];

              // if workload value not in values array, select first value in array
              let workloadValue = parseInt(state.value);
              if (
                state.type === 'select' &&
                !state.values!.includes(workloadValue.toString())
              )
                workloadValue = parseInt(state.values![1]);

              updateSelectedTraining([
                { field: 'workloadType', value: workloadType },
                { field: 'workloadValue', value: workloadValue },
              ]);
            }}
          />
        </Grid2>

        {/* Tempo */}
        <Grid2 size={{ xs: 5, sm: 3.33, lg: 2 }}>
          <SetExerciseAttribute
            options={TEMPO}
            state={(() => {
              const option = TEMPO.find(
                (option) => option.label === tempoOrEffort
              )!;

              return {
                type: option.type,
                label: option.label,
                values: option.values,
                option: option.label as keyof ExerciseMeta,
                format: option.format,
                value:
                  (tempoOrEffort === 'temp' ? state.tempo : state.effort) ??
                  option.values![1].toString(),
              };
            })()}
            onChange={(state) => {
              if (state.label === 'eff' && tempoOrEffort === 'temp') {
                setTempoOrEffort('eff');
                return;
              }

              if (state.label === 'temp' && tempoOrEffort === 'eff') {
                setTempoOrEffort('temp');
                return;
              }

              updateSelectedTraining([
                {
                  field: tempoOrEffort === 'temp' ? 'tempo' : 'effort',
                  value: state.value,
                },
              ]);
            }}
          />
        </Grid2>

        {/* Recovery */}
        <Grid2 size={{ xs: 5, sm: 3.33, lg: 2 }}>
          <SetExerciseAttribute
            options={RECOVERY}
            state={(() => {
              const option = RECOVERY.find((option) => option.label === 'rec')!;
              return {
                type: option.type,
                label: option.label,
                values: option.values,
                option: option.label as keyof ExerciseMeta,
                format: option.format,
                value: state.rec ? state.rec.toString() : '',
              };
            })()}
            onChange={(state) => {
              const rec = parseInt(state.value);
              updateSelectedTraining([{ field: 'rec', value: rec }]);
            }}
          />
        </Grid2>
      </Grid2>
    </Stack>
  );
}
