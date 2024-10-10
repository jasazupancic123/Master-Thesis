'use client';

import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { FormControl, TextField } from '@mui/material';
import {
  SetExerciseOption,
  TRAINING_EXERCISE_EFFORT,
  TRAINING_EXERCISE_RECOVERY,
  TRAINING_EXERCISE_SET,
  TRAINING_EXERCISE_SET_TYPE,
  TRAINING_EXERCISE_WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { useEffect, useState } from 'react';
import type { TrainingExercise } from '@/training/entity/training-exercise.entity';
import type { TrainingExerciseMeta } from '@/training/entity/training-exercise-meta.entity';

interface Props {
  exercise: TrainingExercise;
  onChange: (data: Partial<TrainingExerciseMeta>) => void;
}

export default function TrainingExerciseCard(props: Props) {
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
    if (JSON.stringify(data) === JSON.stringify({
      order: exercise.order,
      sets: exercise.meta.sets,
      setType: exercise.meta.setType,
      setTypeValue: exercise.meta.setTypeValue,
      workloadType: exercise.meta.workloadType,
      workloadValue: exercise.meta.workloadValue,
      rec: exercise.meta.rec,
      // tempo: setExercise.superExerciseInfo?.tempo,
      effort: exercise.meta.effort,
    }))
      return;

    onChange(data);
  }, [exercise.meta, exercise.order, state, onChange]);

  return <Stack direction="column" spacing={1} p={1}>
    <Typography variant="body1" fontWeight="bold" textTransform="uppercase">
      {exercise.exercise?.name}
    </Typography>

    <Stack direction="row" spacing={1} flexWrap="wrap">
      {/* Sets */}
      <SetExerciseAttribute
        options={TRAINING_EXERCISE_SET}
        state={(() => {
          const option = TRAINING_EXERCISE_SET.find(option => option.label === 'sets')!;
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
          setState(prev => ({ ...prev, sets }));
        }}
      />

      {/* Set Type */}
      <SetExerciseAttribute
        options={TRAINING_EXERCISE_SET_TYPE}
        state={(() => {
          const option = TRAINING_EXERCISE_SET_TYPE.find(option => option.label === state.setType)!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: state.setTypeValue.toString() ?? option.values![1].toString(),
          };
        })()}
        onChange={(state) => {
          const setType = state.option as TrainingExerciseMeta['setType'];
          const setTypeValue = parseInt(state.value);
          setState(prev => ({
            ...prev,
            setType,
            setTypeValue: isNaN(setTypeValue) ? 5 : setTypeValue, // 5 because all set type options include 5
          }));
        }}
      />

      {/* Workload */}
      <SetExerciseAttribute
        options={TRAINING_EXERCISE_WORKLOAD}
        state={(() => {
          const option = TRAINING_EXERCISE_WORKLOAD.find(option => option.label === state.workloadType)!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: (state.workloadValue || 10).toString(),
          };
        })()}
        onChange={(state) => {
          const workloadType = state.option as TrainingExerciseMeta['workloadType'];

          // if workload value not in values array, select first value in array
          let workloadValue = parseInt(state.value);
          if (state.type === 'select' && !state.values!.includes(workloadValue.toString()))
            workloadValue = parseInt(state.values![1]);

          setState(prev => ({
            ...prev,
            workloadType,
            workloadValue,
          }));
        }}
      />

      {/* Effort */}
      <SetExerciseAttribute
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
      />

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
        options={TRAINING_EXERCISE_RECOVERY}
        state={(() => {
          const option = TRAINING_EXERCISE_RECOVERY.find(option => option.label === 'rec')!;
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
          setState(prev => ({ ...prev, rec }));
        }}
      />
    </Stack>
  </Stack>;
}

const sx = {
  '& .MuiSelect-icon': { display: 'none' },
  '& .MuiSelect-select': {
    fontSize: '0.7rem',
    color: 'lightgrey',
    backgroundColor: 'transparent',
    height: 30,
  },
  p: '5px',
};

interface State {
  option: string;
  value: string;
  type: SetExerciseOption['type'];
  values?: SetExerciseOption['values'];
  format: SetExerciseOption['format'];
}

interface SetExerciseAttributeProps {
  state: State;
  onChange: (data: State) => void;
  options: SetExerciseOption[];
  disabled?: boolean;
}

export function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const { options, state, onChange, disabled = false } = props;

  return <Stack direction="column">
    {/* On option change */}
    <FormControl variant="filled" size="small" sx={sx}>
      <Select
        variant="filled"
        sx={sx['& .MuiSelect-select']}
        disableUnderline={true}
        value={state.option}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value as string;
          const option = options.find(option => option.label === value);
          if (!option) return;

          onChange({
            ...option,
            option: value,
            type: option.type,
            values: option.values ?? [],
            value: option.values ? option.values[0].toString() : '10',
          } as State);
        }}
      >
        {options.map(option => (
          <MenuItem key={option.label} value={option.label}>{option.label.toUpperCase()}</MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* On value change */}
    {state.type === 'select' ? (
      <FormControl
        variant="filled"
        size="small"
        sx={sx}
        disabled={disabled}
      >
        <Select
          variant="filled"
          sx={sx['& .MuiSelect-select']}
          value={state.value}
          disabled={disabled}
          onChange={(e) => {
            const value = e.target.value as string;
            onChange({ ...state, value });
          }}
        >
          {(state.values || []).map(value => (
            <MenuItem key={value} value={value}>{state.format(value)}</MenuItem>
          ))}
        </Select>
      </FormControl>
    ) : (
      <TextField
        variant="standard"
        value={state.value}
        type={state.type}
        size="small"
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          onChange({ ...state, value });
        }}
        InputLabelProps={{ shrink: true }}
        sx={{
          '& .MuiInputBase-input': {
            fontSize: '0.7rem',
            pl: 1,
            pt: 1,
            height: 22,
          },
          width: 70,
        }}
      />
    )}
  </Stack>;
}