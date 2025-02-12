'use client';

import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Box, FormControl, TextField } from '@mui/material';
import {
  SetExerciseOption,
  RECOVERY,
  SET,
  SET_TYPE,
  WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import {
  ExerciseMeta,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';

interface Props {
  exercise: TrainingExercise;
  onChange: (data: Partial<ExerciseMeta>) => void;
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // White background with 5% transparency
        padding: '10px', // Internal padding for each drill
        borderRadius: '0px',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)', // Optional: Add slight shadow for visual separation
        marginBottom: '5px', // Vertical gap between exercises
      }}
    >
      <Stack direction="row">
        <Box
          width={20}
          height={20}
          sx={{ backgroundColor: exercise.color, mr: 2 }}
        />

        <Typography
          variant="body1"
          fontWeight="bold"
          textTransform="uppercase"
          sx={{
            color: 'white', // Set text color to white
            textAlign: 'center', // Align text to the center
          }}
        >
          {exercise.exercise?.name}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap">
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
  disabled?: boolean;
}

export function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const { options, state, onChange, disabled = false } = props;

  return (
    <Stack direction="column">
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
            const option = options.find((option) => option.label === value);
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
          {options.map((option) => (
            <MenuItem key={option.label} value={option.label}>
              {option.label.toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* On value change */}
      {state.type === 'select' ? (
        <FormControl variant="filled" size="small" sx={sx} disabled={disabled}>
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
            {(state.values || []).map((value) => (
              <MenuItem key={value} value={value}>
                {state.format(value)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TextField
          variant="filled"
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
            mt: 0,
            bgcolor: 'transparent',
            height: sx['& .MuiSelect-select'].height,
            width: 70,
            '& .MuiInputBase-root': {
              borderBottom: 'none',
              border: 'none',
            },
            '& .MuiInputBase-input': {
              border: 'none',
              borderBottom: 'none',
              padding: '1px',
              textAlign: 'center',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }}
        />
      )}
    </Stack>
  );
}
