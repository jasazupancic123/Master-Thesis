'use client';

import Typography from '@mui/material/Typography';
import { SetExercise, SuperExerciseInfo } from '@/type/training.type';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { FormControl, TextField } from '@mui/material';
import {
  SET_EXERCISE_EFFORT,
  SET_EXERCISE_RECOVERY,
  SET_EXERCISE_SET,
  SET_EXERCISE_SET_TYPE,
  SET_EXERCISE_WORKLOAD,
  SetExerciseOption,
} from '@/constant/set-exercise';
import { useEffect, useState } from 'react';

interface Props {
  setExercise: SetExercise;
  onChange: (data: Partial<SuperExerciseInfo> & { order: number }) => void;
}

export default function SetExerciseCard(props: Props) {
  const { setExercise, onChange } = props;
  const [state, setState] = useState(() => setExercise.superExerciseInfo!);
  if (!setExercise.superExerciseInfo)
    return null;

  /**
   * Update set exercise on state change
   */
  useEffect(() => {
    // manual data object to avoid id, createdAt, updatedAt, etc.
    const data = {
      order: setExercise.order,
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
      order: setExercise.order,
      sets: setExercise.superExerciseInfo?.sets,
      setType: setExercise.superExerciseInfo?.setType,
      setTypeValue: setExercise.superExerciseInfo?.setTypeValue,
      workloadType: setExercise.superExerciseInfo?.workloadType,
      workloadValue: setExercise.superExerciseInfo?.workloadValue,
      rec: setExercise.superExerciseInfo?.rec,
      // tempo: setExercise.superExerciseInfo?.tempo,
      effort: setExercise.superExerciseInfo?.effort,
    }))
      return;

    onChange(data);
  }, [state]);

  return <Stack direction="column" spacing={3} p={1}>
    <Typography variant="body1" fontWeight="bold" textTransform="uppercase">
      {setExercise.exercise?.name}
    </Typography>

    <Stack direction="row" spacing={1}>
      {/* Sets */}
      <SetExerciseAttribute
        options={SET_EXERCISE_SET}
        state={(() => {
          const option = SET_EXERCISE_SET.find(option => option.label === 'sets')!;
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
        options={SET_EXERCISE_SET_TYPE}
        state={(() => {
          const option = SET_EXERCISE_SET_TYPE.find(option => option.label === state.setType)!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: state.setTypeValue.toString() ?? option.values![1].toString(),
          };
        })()}
        onChange={(state) => {
          const setType = state.option as SuperExerciseInfo['setType'];
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
        options={SET_EXERCISE_WORKLOAD}
        state={(() => {
          const option = SET_EXERCISE_WORKLOAD.find(option => option.label === state.workloadType)!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: (state.workloadValue || 10).toString(),
          };
        })()}
        onChange={(state) => {
          const workloadType = state.option as SuperExerciseInfo['workloadType'];

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
        options={SET_EXERCISE_EFFORT}
        state={(() => {
          const option = SET_EXERCISE_EFFORT.find(option => option.label === 'effort')!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: state.effort ?? option.values![1].toString(),
          };
        })()}
        onChange={(state) => {
          const effort = state.value as SuperExerciseInfo['effort'];
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
        options={SET_EXERCISE_RECOVERY}
        state={(() => {
          const option = SET_EXERCISE_RECOVERY.find(option => option.label === 'rec')!;
          return {
            type: option.type,
            values: option.values,
            option: option.label,
            format: option.format,
            value: state.rec.toString(),
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
  border: 'none',
  size: 'small',
  backgroundColor: 'transparent',
  '& .MuiSelect-icon': { display: 'none' },
  '& .MuiSelect-select': {
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
    fontSize: '0.7rem',
    color: 'lightgrey',
    backgroundColor: 'transparent',
    borderBottom: 'none',
  },
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
}

function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const { options, state, onChange } = props;

  return <Stack direction="column">
    {/* On option change */}
    <FormControl variant="filled" size="small" sx={sx}>
      <Select
        sx={sx['& .MuiSelect-select']}
        disableUnderline={true}
        value={state.option}
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
      >
        <Select
          sx={sx['& .MuiSelect-select']}
          value={state.value}
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
        value={state.value}
        type={state.type}
        size="small"
        onChange={(e) => {
          const value = e.target.value;
          onChange({ ...state, value });
        }}
        variant="filled"
        sx={{
          mt: 0,
          bgcolor: 'transparent',
          height: sx['& .MuiSelect-select'].height,
          '& .MuiInputBase-root': {
            borderBottom: 'none',
            border: 'none',
          },
          '& .MuiInputBase-input': {
            border: 'none',
            borderBottom: 'none',
            padding: '2px',
            textAlign: 'center',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
        InputLabelProps={{ shrink: true }}
      />
    )}
  </Stack>;
}