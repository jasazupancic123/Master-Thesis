import {
  Box,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';

import {
  disableBorder,
  exerciseCardSetAttributeSx,
} from '../trainer-group-day-view/style/exercise-card-set-attribute.style';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import { KG, SETS } from '@/core/exercise/constant/exercise-param.constant';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useGroup } from '@/store/group.provider';
import NumericParamInputBox from './numeric-param-input-box';
import { useEffect, useRef, useState } from 'react';
import { useScreenSize } from '@/store/screen-size.provider';
import ExerciseParamValueText from './exercise-param-value-text';

interface Props {
  exercise: TrainingExercise;
  options: Attribute[];
  selected: string;
  value: number | string | null;
  onSelectChange?: SetState<string>;
  onInputChange?: SetState<string>;
  athleteView?: boolean;
  colorToPrimary?: boolean;
  trainingInProgressView?: boolean;
  lOrR?: 'L' | 'R';
  showOptions?: boolean;
  readOnly?: boolean;
  disableOptions?: boolean;
  disable?: boolean;
}

export function NumberExerciseParam(props: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    options,
    selected,
    value: initValue,
    onSelectChange,
    onInputChange,
    athleteView,
    colorToPrimary,
    trainingInProgressView,
    showOptions = true,
    disableOptions = false,
    disable = false,
    readOnly = false,
  } = props;

  const group = useGroup() ?? {};
  const { setDetectedChanges } =
    athleteView || !group ? { setDetectedChanges: undefined } : group;

  const exerciseParam =
    selected === 'sets'
      ? SETS
      : core.exercise.param.get(selected as ExerciseParamField);

  if (!exerciseParam || typeof initValue !== 'number') return null;

  const { min, max } = exerciseParam;

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number>(initValue);
  const anchorEl = useRef<HTMLElement | null>(null);
  const valueBoxRef = useRef<HTMLDivElement | null>(null);

  const isFloat = typeof selected === 'string' && KG.field === selected;

  useEffect(() => {
    setValue(initValue);
  }, [initValue]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent={trainingInProgressView ? 'flex-start' : 'center'}
      alignItems="center"
      width="100%"
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
            value={selected}
            onChange={(e) => {
              onSelectChange?.(e.target.value as string);
              if (!athleteView && setDetectedChanges) setDetectedChanges(true);
            }}
          >
            <MenuItem
              disabled
              key={selected}
              value={selected}
              sx={{
                textAlign: 'center',
                p: 2,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            >
              {exerciseParam.name[0].toUpperCase() +
                exerciseParam.name.slice(1)}
            </MenuItem>

            {options?.map((p) => (
              <MenuItem
                key={p.field as string}
                value={p.field as string}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                {p.name[0].toUpperCase() + p.name.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {trainingInProgressView ? (
        <Box
          ref={anchorEl}
          width={screenSize.isUltraSmall ? 20 : 50}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            px: 2,
            zIndex: 10,
            position: 'relative',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Box
            ref={valueBoxRef}
            onClick={() => {
              if (disable) return;

              setOpen((o) => !o);
            }}
          >
            <ExerciseParamValueText value={value} />
          </Box>

          {open && onInputChange && (
            <NumericParamInputBox
              anchorEl={anchorEl.current}
              value={value}
              open={open}
              setOpen={setOpen}
              onSubOptionChange={onInputChange}
              isFloat={isFloat}
            />
          )}
        </Box>
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
            value={value}
            type="number"
            size="small"
            onChange={(e) => {
              if (readOnly) return;

              let value: number = parseFloat(e.target.value);
              if (max || min) {
                if (max && value > max) value = max;
                else if (min && value < min) value = min;
              }

              onInputChange?.(value.toString());
              if (!athleteView && setDetectedChanges) setDetectedChanges(true);
            }}
            disabled={readOnly || disable}
            inputProps={{
              min,
              max,
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
                WebkitTextFillColor: readOnly ? 'white !important' : undefined,
              },
              '& .Mui-disabled': { color: 'rgba(255, 255, 255, 0) !important' },
            }}
          />
        </FormControl>
      )}
    </Box>
  );
}
