import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useTheme } from '@mui/material';

import {
  disableBorder,
  exerciseCardSetAttributeSx,
} from '../trainer-group-day-view/style/exercise-card-set-attribute.style';
import NumericExerciseParam from './components/numeric-exercise-param/numeric-exercise-param';
import type { SetState } from '@/common/type/state.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { IntType } from '@/controller/component/enum/param.enum';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';

interface Props {
  param: string;
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
  dissableSettingValue?: boolean;
  colorToPrimary?: boolean;
  trainingInProgressView?: boolean;
  lOrR?: 'L' | 'R';
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
    dissableSettingValue,
    colorToPrimary,
    trainingInProgressView,
    lOrR,
  } = props;

  const group = useGroup() ?? {};

  const { setDetectedChanges } =
    athleteView || !group ? { setDetectedChanges: undefined } : group;

  if (!value) return null;

  const nestedOption = param.options?.find((o) =>
    value.selected.includes(o.field)
  );

  return (
    <Stack
      direction="column"
      justifyContent={trainingInProgressView ? 'flex-start' : 'center'}
      alignItems="center"
      sx={{
        minHeight: trainingInProgressView && lOrR === 'L' ? 58 : undefined,
      }}
      gap={
        trainingInProgressView && nestedOption?.type === 'select'
          ? 0.5
          : undefined
      }
    >
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
              },
              '& .MuiInputBase-input': {
                textAlign: 'center',
                paddingRight: '0px !important',
                paddingLeft: '0px !important',
              },
              '&.Mui-disabled': {
                backgroundColor: 'transparent',
              },

              '&.Mui-disabled .MuiSelect-select': trainingInProgressView
                ? {
                    color: theme.palette.text.primary,
                    WebkitTextFillColor: theme.palette.text.primary, // <-- important for disabled text
                  }
                : {},
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
      {nestedOption?.type === 'select' || value.selected === IntType.Eff ? (
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
            disabled={readOnly || dissableSettingValue}
            variant="filled"
            value={value.value}
            sx={{
              textAlign: 'center',
              mb:
                lOrR === 'L' && trainingInProgressView
                  ? 0.8
                  : lOrR === 'R' && trainingInProgressView
                    ? 0.3
                    : 0,
              '& .MuiSelect-select': { textAlign: 'center' },
              '& .MuiInputBase-input': {
                py: 0,
                width: '100% !important',
                fontSize: trainingInProgressView ? 16 : 12,
                height: 25,
                textAlign: 'center',
                px: '0px !important',
                color: theme.palette.text.primary,
                fontWeight: trainingInProgressView ? 600 : 400,
              },
              '::before': {
                border: 'none !important',
              },
              '& .MuiInputBase-input.Mui-disabled': {
                color: readOnly
                  ? 'white !important'
                  : dissableSettingValue
                    ? `${theme.palette.text.primary} !important`
                    : undefined,
                WebkitTextFillColor: readOnly
                  ? 'white !important'
                  : dissableSettingValue
                    ? `${theme.palette.text.primary} !important`
                    : undefined,
                backgroundColor: dissableSettingValue
                  ? 'transparent !important'
                  : undefined,
              },
              '&.Mui-disabled': {
                backgroundColor: dissableSettingValue
                  ? 'transparent !important'
                  : undefined,
                color: dissableSettingValue
                  ? `${theme.palette.text.primary} !important`
                  : undefined,
              },
            }}
            onChange={(e) => {
              onSubOptionChange(e.target.value as string);
              if (!athleteView && setDetectedChanges) setDetectedChanges(true);
            }}
          >
            {value.selected === IntType.Eff ? (
              ['Easy', 'Mod', 'Hard', 'Max'].map((v, i) => (
                <MenuItem
                  key={v}
                  value={i}
                  sx={{
                    textAlign: 'center',
                    textShadow: '1px 1px 2px rgba(23, 16, 16, 0.5)',
                  }}
                >
                  {v}
                </MenuItem>
              ))
            ) : (
              <>
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
              </>
            )}
          </Select>
        </FormControl>
      ) : (
        // NUMERIC VALUES
        <>
          {trainingInProgressView &&
          ![IntType.Tempo, IntType.Eff].includes(value.selected as IntType) ? (
            <NumericExerciseParam
              initValue={parseFloat(value.value)}
              param={param}
              exercise={propsExercise}
              disabled={readOnly}
              onSubOptionChange={onSubOptionChange}
            />
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
                  if (!athleteView && setDetectedChanges)
                    setDetectedChanges(true);
                }}
                onBlur={() => {
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
                    fontSize: trainingInProgressView ? 16 : 12,
                    fontWeight: trainingInProgressView ? 600 : undefined,
                    paddingRight: '0px !important',
                    paddingLeft: '0px !important',
                    color: theme.palette.text.primary,
                  },
                }}
                sx={{
                  textAlign: 'center',
                  backgroundColor: trainingInProgressView
                    ? 'transparent !important'
                    : undefined,
                  '& .MuiInputBase-input': {
                    minHeight: trainingInProgressView ? 24 : undefined,
                    p: 0.5,
                    py: trainingInProgressView ? 1 : undefined,
                    textAlign: 'center',
                    color: colorToPrimary
                      ? `${theme.palette.primary.main} !important`
                      : theme.palette.text.primary,
                    fontSize: 12,
                    fontWeight: 400,
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: readOnly ? 'white !important' : undefined,
                    WebkitTextFillColor: readOnly
                      ? 'white !important'
                      : undefined,
                  },
                  '& .Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0) !important',
                  },
                }}
              />
            </FormControl>
          )}
        </>
      )}
    </Stack>
  );
}
