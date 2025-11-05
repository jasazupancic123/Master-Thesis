import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';

import {
  disableBorder,
  exerciseCardSetAttributeSx,
} from '../trainer-group-day-view/style/exercise-card-set-attribute.style';
import ExerciseParamValueText from './exercise-param-value-text';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { IMG_URLS } from '@/lib/common/const/img-urls.const';
import type { SetState } from '@/lib/common/type/state.type';
import { useGroup } from '@/store/group.provider';

interface Props {
  exercise: TrainingExercise;
  options: Attribute[];
  selected: string;
  value: number | string | null;
  onSelectChange?: SetState<string>;
  onInputChange?: SetState<string>;
  athleteView?: boolean;
  trainingInProgressPrimaryItem?: boolean;
  trainingInProgressSecondaryItem?: boolean;
  renderIconOnly?: boolean;
  lOrR?: 'L' | 'R';
  showOptions?: boolean;
  readOnly?: boolean;
  disableOptions?: boolean;
  disableSets?: boolean;
  disabled?: boolean;
}

export function TempoExerciseParam({
  options,
  selected,
  value,
  onSelectChange,
  onInputChange,
  showOptions = true,
  disableOptions = false,
  disableSets = false,
  readOnly = false,
  athleteView,
  trainingInProgressPrimaryItem,
  trainingInProgressSecondaryItem,
  renderIconOnly,
  disabled,
}: Props) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const group = useGroup() ?? {};
  const { setDetectedChanges } =
    athleteView || !group ? { setDetectedChanges: undefined } : group;

  const exerciseParam = core.exercise.param.get(selected as ExerciseParamField);
  if (!value || !exerciseParam) return null;

  return (
    <Box
      width={
        trainingInProgressPrimaryItem || trainingInProgressSecondaryItem
          ? '50px !important'
          : undefined
      }
      display="flex"
      flexDirection="column"
      justifyContent={
        trainingInProgressPrimaryItem || trainingInProgressSecondaryItem
          ? 'flex-start'
          : 'center'
      }
      alignItems="center"
    >
      {showOptions && (
        <>
          {renderIconOnly ? (
            <Box
              component="img"
              width={16}
              height={16}
              src={IMG_URLS.tempo}
              sx={{
                objectFit: 'contain',
              }}
            />
          ) : (
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
                  height:
                    trainingInProgressPrimaryItem ||
                    trainingInProgressSecondaryItem
                      ? 14
                      : undefined,
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
                  '&.Mui-disabled .MuiSelect-select':
                    trainingInProgressPrimaryItem
                      ? {
                          color: theme.palette.background.lightBorder,
                          WebkitTextFillColor:
                            theme.palette.background.lightBorder, // <-- important for disabled text
                          fontSize: 12,
                        }
                      : trainingInProgressSecondaryItem
                        ? {
                            color: theme.palette.background.lightBorder,
                            WebkitTextFillColor:
                              theme.palette.background.lightBorder, // <-- important for disabled text
                            fontSize: 10,
                          }
                        : {},
                }}
                disableUnderline={true}
                value={selected}
                onChange={(e) => {
                  onSelectChange?.(e.target.value as string);
                  if (!athleteView && setDetectedChanges)
                    setDetectedChanges(true);
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
                      textAlign: 'center',
                      p: 2,
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {p.name[0].toUpperCase() + p.name.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </>
      )}

      <FormControl
        variant="filled"
        size="small"
        sx={{
          ...exerciseCardSetAttributeSx,
          '& .MuiInputBase-input': disableBorder,
        }}
      >
        {trainingInProgressPrimaryItem || trainingInProgressSecondaryItem ? (
          <Box
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              if (readOnly || disableSets) return;

              setAnchorEl(e.currentTarget);
            }}
          >
            {/* parsed value for tempo */}
            <ExerciseParamValueText
              value={value as string}
              secondary={trainingInProgressSecondaryItem}
            />
          </Box>
        ) : (
          <Button
            variant="text"
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={readOnly || disableSets}
          >
            {/* parsed value for tempo */}
            <Typography sx={{ textAlign: 'center', fontSize: 12 }}>
              {value}
            </Typography>
          </Button>
        )}

        {!disabled && (
          <TempoPicker
            open={open}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            value={value as string}
            onChange={(val) => {
              onInputChange?.(val);
              if (!athleteView && setDetectedChanges) setDetectedChanges(true);
            }}
          />
        )}
      </FormControl>
    </Box>
  );
}

type TempoPickerProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  value: string | null;
  onChange: (value: string) => void;
};

function TempoPicker({
  open,
  anchorEl,
  onClose,
  value,
  onChange,
}: TempoPickerProps) {
  const [tempoParts, setTempoParts] = useState(
    value?.split(':').map(Number) ?? [2, 0, 1, 0]
  );

  const updatePart = (index: number, newValue: number) => {
    const next = [...tempoParts];
    next[index] = newValue;
    setTempoParts(next);
  };

  const handleSave = () => {
    onChange(tempoParts.join(':'));
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Stack spacing={1} sx={{ p: 1, minWidth: 220 }}>
        <Stack direction="row" alignItems="start" gap={0.5}>
          {['Ecc', 'Iso', 'Con', 'Idle'].map((label, i) => (
            <Stack key={i} alignItems="center" spacing={0.5}>
              <Typography variant="caption">{label}</Typography>
              <TextField
                type="number"
                size="small"
                value={tempoParts[i]}
                inputProps={{
                  min: 0,
                  max: 9,
                  style: { width: 30, textAlign: 'center' },
                }}
                onChange={(e) => updatePart(i, Number(e.target.value))}
              />
            </Stack>
          ))}
        </Stack>

        <Button
          variant="contained"
          size="small"
          sx={{ mt: 1 }}
          onClick={handleSave}
        >
          Save
        </Button>
      </Stack>
    </Popover>
  );
}
