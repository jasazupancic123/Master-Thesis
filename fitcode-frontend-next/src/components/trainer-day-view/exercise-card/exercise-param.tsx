import {
  Stack,
  FormControl,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { disableBorder, exerciseCardSetAttributeSx } from '../style';
import { SetState } from '@/common/type/state.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { TrainingExercise } from '@/controller/training/type/training-plan.type';

interface Props {
  param: Attribute;
  value: AttributeValue;
  onOptionChange: SetState<string>;
  onSubOptionChange: SetState<string>;
  showOptions?: boolean;
  disableOptions?: boolean;
  disableSets?: boolean;
  readOnly?: boolean;
  exercise?: TrainingExercise;
  setsNumber?: number;
  setSetsNumber?: SetState<number>;
}

export function ExerciseParam(props: Props) {
  const {
    param,
    value,
    onOptionChange,
    onSubOptionChange,
    showOptions = true,
    disableOptions = false,
    disableSets = false,
    readOnly = false,
    setsNumber,
    setSetsNumber,
    exercise: propsExercise,
  } = props;

  const nestedOption = param.options?.find((o) =>
    value.selected.includes(o.field)
  );

  return (
    <Stack direction="column" justifyContent="center" alignItems="center">
      {showOptions && (
        <FormControl
          variant="filled"
          size="small"
          sx={exerciseCardSetAttributeSx}
          disabled={disableOptions}
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
            value={value.selected.split(':')[0]}
            onChange={(e) => {
              onOptionChange(e.target.value as string);
            }}
          >
            <MenuItem
              disabled
              key={param.name}
              value={param.field}
              sx={{
                textAlign: 'center',
                p: 2,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            >
              {param.name[0].toUpperCase() + param.name.slice(1)}
            </MenuItem>

            {param.options?.map((p, i) => {
              return (
                <MenuItem
                  key={i}
                  value={p.field}
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {p.name[0].toUpperCase() + p.name.slice(1)}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}

      {/* Value */}
      {nestedOption?.type === 'select' ? (
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
            disabled={readOnly}
            variant="filled"
            sx={{
              textAlign: 'center',
              '& .MuiSelect-select': { textAlign: 'center' },
              '& .MuiInputBase-input': {
                width: '100% !important',
                fontSize: 14,
                textAlign: 'center',
                px: '0px !important',
              },
              '::before': {
                border: 'none !important',
              },
              '& .MuiInputBase-input.Mui-disabled': {
                color: readOnly ? 'white !important' : undefined,
                WebkitTextFillColor: readOnly ? 'white !important' : undefined,
              },
              '& .Mui-disabled': {
                color: 'rgba(255, 255, 255, 0) !important',
              },
            }}
            value={value.value}
            onChange={(e) => {
              onSubOptionChange(e.target.value as string);
            }}
          >
            {nestedOption?.options?.map((value) => (
              <MenuItem
                key={value.name}
                value={value.field}
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
          sx={{
            ...exerciseCardSetAttributeSx,
            '& .MuiInputBase-input': disableBorder,
          }}
        >
          <TextField
            variant="filled"
            value={value.value}
            type={nestedOption?.type === 'number' ? 'number' : 'string'}
            size="small"
            onChange={(e) => {
              if (readOnly) return;
              onSubOptionChange(e.target.value as string);
            }}
            onBlur={(e) => {
              if (
                value.field === 'volWorkSets' &&
                setsNumber !== undefined &&
                setsNumber !== null &&
                setSetsNumber &&
                propsExercise
              ) {
                if (setsNumber !== propsExercise.sets.length) {
                  setSetsNumber(propsExercise.sets.length);
                }
              }
            }}
            disabled={
              readOnly || (nestedOption?.field === 'set' && disableSets)
            }
            inputProps={{
              style: {
                textAlign: 'center',
                paddingRight: '0px !important',
                paddingLeft: '0px !important',
                color: 'white !important',
              },
            }}
            sx={{
              textAlign: 'center',
              '& .MuiInputBase-input': {
                p: 0.5,
                textAlign: 'center',
                color: 'white',
              },
              '& .MuiInputBase-input.Mui-disabled': {
                color: readOnly ? 'white !important' : undefined,
                WebkitTextFillColor: readOnly ? 'white !important' : undefined,
              },
              '& .Mui-disabled': {
                color: 'rgba(255, 255, 255, 0) !important',
              },
            }}
          />
        </FormControl>
      )}
    </Stack>
  );
}
