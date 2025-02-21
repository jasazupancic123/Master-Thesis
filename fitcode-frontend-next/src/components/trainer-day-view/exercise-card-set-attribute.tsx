import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { SetExerciseAttributeProps, SetExerciseState } from './props';
import { exerciseCardSetAttributeSx } from './style';

export function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const { options, state, onChange, disabled = false } = props;

  return (
    <Stack direction="column">
      {/* On option change */}
      <FormControl
        variant="filled"
        size="small"
        sx={exerciseCardSetAttributeSx}
      >
        <Select
          variant="filled"
          sx={{
            ...exerciseCardSetAttributeSx['& .MuiSelect-select'],
          }}
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
            } as SetExerciseState);
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
        <FormControl
          variant="filled"
          size="small"
          sx={exerciseCardSetAttributeSx}
          disabled={disabled}
        >
          <Select
            variant="filled"
            sx={{
              ...exerciseCardSetAttributeSx['& .MuiSelect-select'],
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
          sx={{
            ...exerciseCardSetAttributeSx,
            mt: 0,
            bgcolor: 'transparent',
            '& .MuiInputBase-root': {
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'transparent',
              },
              '&.Mui-focused': {
                backgroundColor: 'transparent',
              },
            },
            '& .MuiInputBase-input': {
              border: 'none',
              borderBottom: 'none',
              padding: '0px',
              paddingLeft: '4px',
              textAlign: 'center',
              fontSize: '0.7rem',
              height: exerciseCardSetAttributeSx['& .MuiSelect-select'].height,
              color: '#bcb4b1',
              textAlignLast: 'left',
            },
            '&:before, &:after': {
              display: 'none', // Removes the default MUI underline
            },
            '& .MuiFilledInput-underline:before': {
              borderBottom: 'none !important',
            },
            '& .MuiFilledInput-underline:after': {
              borderBottom: 'none !important',
            },
          }}
        />
      )}
    </Stack>
  );
}
