import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { SetExerciseAttributeProps, SetExerciseState } from './props';
import { exerciseCardSetAttributeSx } from './style';
import { useScreenSize } from '@/context/screen-size-provider';

export function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const screenSize = useScreenSize();
  const { options, state, onChange, disabled = false, canEdit } = props;

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
          ))}
        </Select>
      </FormControl>

      {/* On value change */}
      {state.type === 'select' || state.type === 'number' ? (
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
              textAlign: 'center',
              color: 'white',
              pr: '0px !important', // Override MUI's default right padding
              pl: '0px !important', // Consistent left padding
              WebkitTextFillColor: 'white',
              '& .MuiSelect-select': {
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pr: '0px !important', // Override MUI's default right padding
                pl: '0px !important', // Consistent left padding
                color: 'white',
                WebkitTextFillColor: 'white',
                fontSize: screenSize.isBetween(600, 750) ? 11 : 15,
              },
              '& .MuiInputBase-input': {
                textAlign: 'center',
                paddingRight: '0px !important', // Override MUI padding
                paddingLeft: '0px !important',
                color: 'white',
                WebkitTextFillColor: 'white',
                fontSize: screenSize.isBetween(600, 750) ? 11 : 15,
              },
              '&.Mui-disabled': {
                backgroundColor: 'transparent',
                color: 'white',
                WebkitTextFillColor: 'white',
              },
            }}
            disableUnderline={disabled}
            value={state.value}
            disabled={disabled}
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
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
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
                // 🔽 REMOVE ARROWS IN CHROME, SAFARI, EDGE 🔽
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                  '-webkit-appearance': disabled ? 'none' : undefined,
                  margin: 0,
                },
                // 🔽 REMOVE ARROWS IN FIREFOX 🔽
                MozAppearance: disabled ? 'textfield' : '',
              },
              '& .MuiFilledInput-underline:before, & .MuiFilledInput-underline:after':
                {
                  borderBottom: 'none !important',
                },
            }}
          />
        </FormControl>
      )}
    </Stack>
  );
}
