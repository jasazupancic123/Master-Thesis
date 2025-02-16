'use client';

import {
  RECOVERY,
  SET,
  SET_TYPE,
  SetExerciseOption,
  WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { ExerciseMeta } from '@/controller/training/type/training-plan.type';
import { FormControl, TextField } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { SetExerciseAttribute } from './exercise-card-set-attribute';
import { TrainingExerciseCardProps } from './props';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const { exercise, onChange } = props;
  const [state, setState] = useState(() => exercise.meta);

  /**
   * Update set exercise on state change
   */
  useEffect(() => {
    // manual data object to avoid id, createdAt, updatedAt, etc.
    const data = {
      order: exercise.order,
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
        order: exercise.order,
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
  }, [exercise.meta, exercise.order, state]);

  return (
    <Stack
      direction="column"
      spacing={2}
      p={1}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '10px',
        borderRadius: '0px',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        marginBottom: '5px',
      }}
    >
      <Stack direction="row" width="100%" justifyContent="center">
        <Typography
          variant="body1"
          fontWeight="bold"
          textTransform="uppercase"
          sx={{ color: 'white', textAlign: 'center' }}
        >
          {exercise.exercise?.name}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        width="100%"
        justifyContent="center"
      >
        {/* Sets */}
        <SetExerciseAttribute
          options={SET}
          state={(() => {
            const option = SET.find((option) => option.label === 'sets')!;
            return {
              type: option.type,
              values: option.values,
              option: option.label,
              format: option.format,
              value: state.sets.toString() ?? option.values![1].toString(),
            };
          })()}
          onChange={(state) => {
            const sets = parseInt(state.value);
            setState((prev) => ({ ...prev, sets }));
          }}
        />
        {/* Set Type */}
        <SetExerciseAttribute
          options={SET_TYPE}
          state={(() => {
            const option = SET_TYPE.find(
              (option) => option.label === state.setType
            )!;
            return {
              type: option.type,
              values: option.values,
              option: option.label,
              format: option.format,
              value:
                state.setTypeValue.toString() ?? option.values![1].toString(),
            };
          })()}
          onChange={(state) => {
            const setType = state.option as ExerciseMeta['setType'];
            const setTypeValue = parseInt(state.value);
            setState((prev) => ({
              ...prev,
              setType,
              setTypeValue: isNaN(setTypeValue) ? 5 : setTypeValue, // 5 because all set type options include 5
            }));
          }}
        />
        {/* Workload */}
        <SetExerciseAttribute
          options={WORKLOAD}
          state={(() => {
            const option = WORKLOAD.find(
              (option) => option.label === state.workloadType
            )!;
            return {
              type: option.type,
              values: option.values,
              option: option.label,
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

            setState((prev) => ({
              ...prev,
              workloadType,
              workloadValue,
            }));
          }}
        />
        {/* Effort */}
        {/*<SetExerciseAttribute
        options={TRAINING_EXERCISE_EFFORT}
        state={(() => {
          const option = TRAINING_EXERCISE_EFFORT.find(option => option.label === 'effort')!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: state.effort ?? option.values![1].toString(),
          };
        })()}
        onChange={(state) => {
          const effort = state.value as TrainingExerciseMeta['effort'];
          setState(prev => ({ ...prev, effort }));
        }}
      />*/}
        {/* Tempo */}
        {/*<SetExerciseAttribute
        options={SET_EXERCISE_TEMPO}
        state={(() => {
          constant option = SET_EXERCISE_TEMPO.find(option => option.label === 'tempo')!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: state.tempo ?? option.values![1].toString(),
          };
        })()}
        onChange={(state) => {
          constant tempo = state.value as SuperExerciseInfo['tempo'];
          setState(prev => ({ ...prev, tempo }));
        }}
      />*/}
        {/* Recovery */}
        <SetExerciseAttribute
          options={RECOVERY}
          state={(() => {
            const option = RECOVERY.find((option) => option.label === 'rec')!;
            return {
              type: option.type,
              values: option.values,
              option: option.label,
              format: option.format,
              value: state.rec ? state.rec.toString() : '',
            };
          })()}
          onChange={(state) => {
            const rec = parseInt(state.value);
            setState((prev) => ({ ...prev, rec }));
          }}
        />
      </Stack>
    </Stack>
  );
}
