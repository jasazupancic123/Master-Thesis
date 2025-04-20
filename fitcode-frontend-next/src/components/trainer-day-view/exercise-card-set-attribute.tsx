import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { SetExerciseAttributeProps, SetExerciseState } from './props';
import { exerciseCardSetAttributeSx } from './style';
import { useScreenSize } from '@/context/screen-size-provider';

export function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const screenSize = useScreenSize();
  const { options, state, onChange } = props;

  return (
    <Stack direction="column" justifyContent="center" alignItems="center">
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
            textAlign: 'center',
            pr: 0, // Override default paddingRight
            pl: 0, // Make left padding consistent
            color: '#989fa5',
            '& .MuiSelect-select': {
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pr: 0, // Override MUI's default right padding
              pl: 0, // Consistent left padding
              color: '#989fa5',
            },
            '& .MuiInputBase-input': {
              textAlign: 'center',
              paddingRight: '0px !important', // Override MUI padding
              paddingLeft: '0px !important',
              color: '#989fa5',
            },
            '&.Mui-disabled': {
              backgroundColor: 'transparent',
            },
          }}
          disableUnderline={true}
          value={state.label}
          onChange={(e) => {
            const value = e.target.value as string;
            const option = options.find((option) => option.label === value);

            if (!option) return;
            const values = option.values
              ? [...option.values.filter((v) => v.length > 0)]
              : undefined;

            onChange({
              ...option,
              option: value,
              type: option.type,
              values: option.values ?? [],
              value: values ? values.toString() : '10',
              typeChange: true,
            } as SetExerciseState);
          }}
        >
          <MenuItem
            disabled
            key={state.label}
            value={state.label}
            sx={{
              textAlign: 'center',
              p: 2,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {state.label[0].toUpperCase() + state.label.slice(1)}
          </MenuItem>

          {options.map((option) => {
            return (
              <MenuItem
                key={option.label}
                value={option.label}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                {option.label[0].toUpperCase() + option.label.slice(1)}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {/* On value change */}
      {state.type === 'select' ? (
        <FormControl
          variant="filled"
          size="small"
          sx={{
            ...exerciseCardSetAttributeSx,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Select
            variant="filled"
            sx={{
              textAlign: 'center',
              '& .MuiSelect-select': {
                textAlign: 'center', // 👈 This is the magic line
              },
              '& .MuiInputBase-input': {
                width: '100% !important',
                fontSize: 14,
                textAlign: 'center',
                px: '0px !important', // Override MUI padding
              },
            }}
            value={state.value}
            onChange={(e) => {
              const value = e.target.value as string;
              onChange({ ...state, value });
            }}
          >
            {(state.values || []).map((value) => (
              <MenuItem
                key={value}
                value={value}
                sx={{
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(23, 16, 16, 0.5)',
                }}
              >
                {state.format(value)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <FormControl
          variant="filled"
          size="small"
          sx={exerciseCardSetAttributeSx}
        >
          <TextField
            variant="filled"
            value={state.value}
            type={state.type}
            size="small"
            onChange={(e) => {
              const value = e.target.value;
              onChange({ ...state, value });
            }}
            sx={{
              textAlign: 'center',
              color: '#989fa5',
              '& .MuiInputBase-input': {
                p: 0.5,
                textAlign: 'center !important',
              },
              '&.Mui-disabled': {
                backgroundColor: 'transparent',
              },
            }}
            /* sx={{
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              mt: 0,
              width: '100%',
              bgcolor: 'transparent',
              color: 'white',
              WebkitTextFillColor: 'white',
              textAlign: 'center !important',
              '& .MuiInputBase-root': {
                padding: '0px !important', // Remove all padding
                backgroundColor: 'transparent',
                color: 'white',
                WebkitTextFillColor: 'white',
                textAlign: 'center !important',
              },
              '& .MuiInputBase-input': {
                textAlign: 'center !important',
                padding: '0px !important', // Remove any padding issues
                margin: '0 auto', // Ensure text stays centered
                fontSize: '0.7rem',
                height:
                  exerciseCardSetAttributeSx['& .MuiSelect-select'].height,
                backgroundColor: 'transparent',
                color: 'white',
                WebkitTextFillColor: 'white',
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                  margin: 0,
                },
                MozAppearance: '',
              },
              '& .MuiFilledInput-underline:before, & .MuiFilledInput-underline:after':
                {
                  borderBottom: 'none !important',
                },
            }} */
          />
        </FormControl>
      )}
    </Stack>
  );
}
