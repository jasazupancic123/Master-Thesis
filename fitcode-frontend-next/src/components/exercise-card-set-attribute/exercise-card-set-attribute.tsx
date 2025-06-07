import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { SetExerciseAttributeProps } from '../trainer-day-view/props';
import { exerciseCardSetAttributeSx } from '../trainer-day-view/style';
import { useScreenSize } from '@/store/screen-size-provider';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export function SetExerciseAttribute(props: SetExerciseAttributeProps) {
  const screenSize = useScreenSize();
  const { options, state, onChange, expandedView } = props;

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
          disabled={expandedView}
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
            const option = options.find((option) => option.name === value);

            if (!option) return;

            onChange({
              field: option.field,
              selected: option.defaultValue,
              value: '10',
            } as AttributeValue);
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
            {state.name[0].toUpperCase() + state.name.slice(1)}
          </MenuItem>

          {options.map((option) => {
            return (
              <MenuItem
                key={option.name}
                value={option.name}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                {option.name[0].toUpperCase() + option.name.slice(1)}
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
              onChange({
                field: options.find((option) => option.name === state.label)
                  ?.field,
                selected: options.find((option) => option.name === state.label)
                  ?.defaultValue,
                value: value,
              } as AttributeValue);
            }}
          >
            {options.map((value) => (
              <MenuItem
                key={value.name}
                value={value.name}
                sx={{
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(23, 16, 16, 0.5)',
                }}
              >
                {value.name[0].toUpperCase() + value.name.slice(1)}
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
              onChange({
                field: options.find((option) => option.name === state.label)
                  ?.field,
                selected: options.find((option) => option.name === state.label)
                  ?.defaultValue,
                value: value,
              } as AttributeValue);
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
          />
        </FormControl>
      )}
    </Stack>
  );
}
