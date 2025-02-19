import { SetExerciseOption } from '@/common/constant/training-exercise.constant';
import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';

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

  return (
    <Stack direction="column" m={0}>
      {/* On option change */}
      <FormControl variant="filled" size="small" sx={sx}>
        <Select
          variant="filled"
          sx={{ ...sx['& .MuiSelect-select'] }}
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
            <MenuItem
              key={option.label}
              value={option.label}
              sx={{
                width: '10px',
              }}
            >
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
            sx={{
              ...sx['& .MuiSelect-select'],
            }}
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
            width: 60,
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
