'use client';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { SetExercise } from '@/type/training.type';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { FormControl, TextField } from '@mui/material';
import {
  BW_OPTIONS,
  DISTANCE_OPTIONS,
  EFFORT_OPTIONS,
  INT_OPTIONS,
  KG_OPTIONS,
  REC_OPTIONS,
  REP_OPTIONS,
  RM_OPTIONS,
  SET_OPTIONS,
  SetExerciseOption,
  TEMPO_OPTIONS,
  TIME_OPTIONS,
  VO2_OPTIONS,
} from '@/constant/set-exercise';

interface Props {
  setExercise: SetExercise;
  setSetExercise: (setExercise: SetExercise) => void;
  onChange: (setExercise: SetExercise) => void;
}

export default function SetExerciseCard(props: Props) {
  const { setExercise, setSetExercise, onChange } = props;
  const superExerciseInfo = setExercise.superExerciseInfo;

  return <Stack direction="column" spacing={3} p={1}>
    <Typography variant="body1" fontWeight="bold" textTransform="uppercase">
      {setExercise.exercise?.name}
    </Typography>

    <Stack direction="row" spacing={1}>
      {/* Sets */}
      <SetExerciseAttribute
        state={{
          option: SET_OPTIONS.label,
          value: superExerciseInfo?.workloadValue.toString(),
          type: SET_OPTIONS.type,
          values: SET_OPTIONS.values,
        }}
        setState={(state) => {
          setSetExercise({
            ...setExercise,
            superExerciseInfo: {
              ...superExerciseInfo!,
              workloadValue: parseInt(state.value),
            },
          });
        }}
        options={[SET_OPTIONS]}
      />

      {/* Work */}
      <SetExerciseAttribute
        state={{
          option: superExerciseInfo!.setType,
          value: superExerciseInfo!.setTypeValue.toString(),
        }}
        options={[REP_OPTIONS, DISTANCE_OPTIONS, TIME_OPTIONS, VO2_OPTIONS]}
      />

      {/* Intensity */}
      <SetExerciseAttribute
        options={[RM_OPTIONS, BW_OPTIONS, INT_OPTIONS, KG_OPTIONS]}
      />

      {/* Tempo */}
      <SetExerciseAttribute
        options={[TEMPO_OPTIONS, EFFORT_OPTIONS]}
      />

      {/* Recovery */}
      <SetExerciseAttribute
        options={[REC_OPTIONS]}
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
    width: 65,
    fontSize: '0.7rem',
    color: 'lightgrey',
    backgroundColor: 'transparent',
    borderBottom: 'none',
  },
};


interface SetExerciseAttributeProps {
  state: {
    option: string,
    value: string,
    type: SetExerciseOption['type'],
    values?: SetExerciseOption['values'],
  };
  setState: (state: SetExerciseAttributeProps['state']) => void;
  options: SetExerciseOption[];
}

function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const { options, state, setState } = props;

  return <Box bgcolor="transparent" m={0} p={0}>
    <Stack direction="column" spacing={1}>
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

            setState({
              option: value,
              type: option.type,
              values: option.values ?? [],
              value: option.values ? option.values[0] : '',
            });
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
              setState({ ...state, value });
            }}
          >
            {(state.values || []).map(value => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
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
            setState({ ...state, value });
          }}
          variant="filled"
          sx={{
            mt: 0,
            width: '60px',
            bgcolor: 'transparent',
            '& .MuiInputBase-root': {
              borderBottom: 'none',
              border: 'none',
            },
            '& .MuiInputBase-input': {
              border: 'none',
              borderBottom: 'none',
              padding: '2px',
              height: '20px',
              textAlign: 'center',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            height: '25px',
          }}
          InputLabelProps={{ shrink: true }}
        />
      )}
    </Stack>
  </Box>;
}