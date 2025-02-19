'use client';

import {
  EFFORT,
  RECOVERY,
  SET,
  SET_TYPE,
  TEMPO,
  TEMPO_OPTIONS,
  WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { ExerciseMeta } from '@/controller/training/type/training-plan.type';
import { Grid2 } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { SetExerciseAttribute } from './exercise-card-set-attribute';
import { SetExerciseState, TrainingExerciseCardProps } from './props';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const { exercise, onChange, supersetIndex: j } = props;
  const { training, setTraining, component } = useGroup();

  const i = training?.components.findIndex((c) => c.id === component?.id);
  const k = training?.components[i!].supersets[j!].exercises.findIndex(
    (e) => e.id === exercise.id
  );

  const state = training?.components[i!].supersets[j!].exercises[k!]?.meta;

  /**
   * Update set exercise on state change
   */
  /* useEffect(() => {
    // manual data object to avoid id, createdAt, updatedAt, etc.
    const data = {
      sets: state.sets,
      setType: state.setType,
      setTypeValue: state.setTypeValue,
      workloadType: state.workloadType,
      workloadValue: state.workloadValue,
      rec: state.rec,
      // tempo: state.tempo,
      effort: state.effort,
    };

    // if data didn't change, don't update
    if (
      JSON.stringify(data) ===
      JSON.stringify({
        sets: exercise.meta.sets,
        setType: exercise.meta.setType,
        setTypeValue: exercise.meta.setTypeValue,
        workloadType: exercise.meta.workloadType,
        workloadValue: exercise.meta.workloadValue,
        rec: exercise.meta.rec,
        // tempo: setExercise.superExerciseInfo?.tempo,
        effort: exercise.meta.effort,
      })
    )
      return;

    onChange(data);
  }, [exercise.meta, exercise, state]); */

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
  }

  if (!training || !component || !state) return null;

  return (
    <Stack
      spacing={1}
      p={0.5}
      pb={3}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Stack direction="row" justifyContent="center">
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

      <Grid2 container spacing={1}>
        {/* Sets */}
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <SetExerciseAttribute
            options={SET}
            state={(() => {
              const option = SET.find((option) => option.label === 'sets')!;
              return {
                type: option.type,
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
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <SetExerciseAttribute
            options={SET_TYPE}
            state={(() => {
              const option = SET_TYPE.find(
                (option) => option.label === state.setType
              )!;

              return {
                type: option.type,
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
                  value: isNaN(setTypeValue) ? 0 : setTypeValue,
                }, // 5 because all set type options include 5
              ]);
            }}
          />
        </Grid2>

        {/* Workload */}
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <SetExerciseAttribute
            options={WORKLOAD}
            state={(() => {
              const option = WORKLOAD.find(
                (option) => option.label === state.workloadType
              )!;

              return {
                type: option.type,
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

        {/* Effort */}
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <SetExerciseAttribute
            options={EFFORT}
            state={(() => {
              const option = EFFORT.find((option) => option.label === 'eff')!;
              return {
                type: option.type,
                values: option.values,
                option: option.label as keyof ExerciseMeta,
                format: option.format,
                value: state.effort ?? option.values![1].toString(),
              };
            })()}
            onChange={(state) => {
              const effort = state.value as ExerciseMeta['effort'];
              updateSelectedTraining([{ field: 'effort', value: effort! }]);
            }}
          />
        </Grid2>

        {/* Tempo */}
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <SetExerciseAttribute
            options={TEMPO}
            state={(() => {
              const option = TEMPO.find((option) => option.label === 'temp')!;

              return {
                type: option.type,
                values: option.values,
                option: option.label as keyof ExerciseMeta,
                format: option.format,
                value: state.tempo ?? option.values![1].toString(),
              };
            })()}
            onChange={(state) => {
              const tempo = state.value as ExerciseMeta['tempo'];
              updateSelectedTraining([{ field: 'tempo', value: tempo! }]);
            }}
          />
        </Grid2>

        {/* Recovery */}
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <SetExerciseAttribute
            options={RECOVERY}
            state={(() => {
              const option = RECOVERY.find((option) => option.label === 'rec')!;
              return {
                type: option.type,
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
