import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useTheme } from '@mui/material';

import {
  disableBorder,
  exerciseCardSetAttributeSx,
} from '../trainer-day-view/style';
import type { SetState } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';

interface Props {
  param: Attribute;
  value?: AttributeValue;
  onOptionChange: SetState<string>;
  onSubOptionChange: SetState<string>;
  showOptions?: boolean;
  disableOptions?: boolean;
  disableSets?: boolean;
  readOnly?: boolean;
  exercise?: TrainingExercise;
  setsNumbers?: { exerciseId: string; setsNumber: number }[];
  setSetsNumbers?: SetState<{ exerciseId: string; setsNumber: number }[]>;
  handleSetNumberChange?: (value: number) => void;
  min?: number;
  max?: number;
  athleteView?: boolean;
}

export function ExerciseParam(props: Props) {
  const theme = useTheme();

  const {
    param,
    value,
    onOptionChange,
    onSubOptionChange,
    showOptions = true,
    disableOptions = false,
    disableSets = false,
    readOnly = false,
    setsNumbers,
    setSetsNumbers,
    exercise: propsExercise,
    min,
    max,
    athleteView,
  } = props;

  const { setDetectedChanges } =
    athleteView || !useGroup()
      ? { setDetectedChanges: undefined }
      : (useGroup() ?? {});

  if (!value) return null;

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
              fontWeight: 700,
              '& .MuiSelect-select': {
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pr: 0,
                pl: 0,
                color: theme.palette.background.lightBorder,
              },
              '& .MuiInputBase-input': {
                textAlign: 'center',
                paddingRight: '0px !important',
                paddingLeft: '0px !important',
              },
              '&.Mui-disabled': {
                backgroundColor: 'transparent',
              },
            }}
            disableUnderline={true}
            value={value.selected.split(':')[0]}
            onChange={(e) => {
              onOptionChange(e.target.value as string);
              if (!athleteView && setDetectedChanges) setDetectedChanges(true);
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
                py: 0,
                width: '100% !important',
                fontSize: 12,
                height: 25,
                textAlign: 'center',
                px: '0px !important',
                color: theme.palette.text.primary,
                fontWeight: 400,
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
              if (!athleteView && setDetectedChanges) setDetectedChanges(true);
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
              if ((max || min) && nestedOption?.type === 'number') {
                const numValue = parseFloat(e.target.value);
                if (typeof max === 'number' && numValue > max)
                  e.target.value = max.toString();
                else if (typeof min === 'number' && numValue < min)
                  e.target.value = min.toString();
              }
              onSubOptionChange(e.target.value as string);
              if (!athleteView && setDetectedChanges) setDetectedChanges(true);
            }}
            onBlur={(e) => {
              if (
                value.field === 'volWorkSets' &&
                setsNumbers !== undefined &&
                setsNumbers !== null &&
                setSetsNumbers &&
                propsExercise
              ) {
                const setsNumber = setsNumbers.find(
                  (s) => s.exerciseId === propsExercise.id
                )?.setsNumber;

                if (setsNumber === undefined || setsNumber === null) return;

                if (setsNumber !== propsExercise.sets.length) {
                  const newSetsNumber = propsExercise.sets.length;
                  setSetsNumbers((prev) => {
                    const newSetsNumbers = prev.filter(
                      (s) => s.exerciseId !== propsExercise.id
                    );
                    newSetsNumbers.push({
                      exerciseId: propsExercise.id,
                      setsNumber: newSetsNumber,
                    });
                    return newSetsNumbers;
                  });
                }
              }
            }}
            disabled={
              readOnly || (nestedOption?.field === 'set' && disableSets)
            }
            inputProps={{
              min: min && nestedOption?.type === 'number' ? min : undefined,
              max: max && nestedOption?.type === 'number' ? max : undefined,
              style: {
                textAlign: 'center',
                fontSize: 12,
                paddingRight: '0px !important',
                paddingLeft: '0px !important',
                color: theme.palette.text.primary,
              },
            }}
            sx={{
              textAlign: 'center',
              '& .MuiInputBase-input': {
                p: 0.5,
                textAlign: 'center',
                color: theme.palette.text.primary,
                fontSize: 12,
                fontWeight: 400,
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
