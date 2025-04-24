import { Stack, FormControl, Select, MenuItem } from '@mui/material';
import { exerciseCardSetAttributeSx } from './style';
import { ComponentParam } from '@/controller/component/type/component.type';
import { SetState } from '@/common/type/state.type';

interface Props {
  param: ComponentParam;
  state: { field: string; label: string; selected: string }[];
  setState: SetState<{ field: string; label: string; selected: string }[]>;
}

export function ExerciseParamOptions(props: Props) {
  const { param, state, setState } = props;
  const current = state.find((p) => p.field === param.field);
  if (!current) return null;

  return (
    <Stack direction="column" justifyContent="center" alignItems="center">
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
            pr: 0,
            pl: 0,
            color: '#989fa5',
            '& .MuiSelect-select': {
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pr: 0,
              pl: 0,
              color: '#989fa5',
            },
            '& .MuiInputBase-input': {
              textAlign: 'center',
              paddingRight: '0px !important',
              paddingLeft: '0px !important',
              color: '#989fa5',
            },
            '&.Mui-disabled': {
              backgroundColor: 'transparent',
            },
          }}
          disableUnderline={true}
          value={current.selected}
          onChange={(e) => {
            const value = e.target.value as string;
            const newState = [...state];
            const index = newState.findIndex((v) => v.field === param.field);
            newState[index].selected = value;
            setState(newState);
          }}
        >
          <MenuItem
            disabled
            key={param.field}
            value={param.field}
            sx={{
              textAlign: 'center',
              p: 2,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {param.field[0].toUpperCase() + param.field.slice(1)}
          </MenuItem>
          {param.options?.map((p) => {
            return (
              <MenuItem
                key={p.field}
                value={p.field}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                {p.field[0].toUpperCase() + p.field.slice(1)}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Stack>
  );
}
