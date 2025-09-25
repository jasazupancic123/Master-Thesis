import { Attribute } from '@/controller/attribute/type/attribute.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useRef, useState } from 'react';

interface NumericExerciseParamProps {
  initValue: number;
  param: Attribute;
  exercise?: TrainingExercise;
  isInt?: boolean;
  disabled?: boolean;
}

export default function NumericExerciseParam(props: NumericExerciseParamProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const supersetsContext = useSupersets();
  const {
    setOpenNumericInput,
    setNumericInputAnchorEl,
    setSelectedNumericInputParam,
  } = supersetsContext || {
    setOpenNumericInput: undefined,
    setNumericInputAnchorEl: undefined,
    setSelectedNumericInputParam: undefined,
  };

  const { initValue, isInt, disabled, param, exercise } = props;

  const [value, setValue] = useState<number>(initValue);
  const valueBoxRef = useRef<HTMLDivElement | null>(null);

  return (
    <Box
      width={screenSize.isUltraSmall ? 20 : 50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        py: 1,
        px: 2,
        zIndex: 1,
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Box
        ref={valueBoxRef}
        px={1}
        onClick={() => {
          if (disabled) return;

          setOpenNumericInput && setOpenNumericInput(true);
          setNumericInputAnchorEl &&
            setNumericInputAnchorEl(valueBoxRef.current);
          if (setSelectedNumericInputParam) {
            const selected =
              param.field === ParamType.VolWorkSets
                ? 'Set'
                : exercise?.sets.length === 0
                  ? undefined
                  : exercise?.sets[0].paramValuesL.find(
                      (p) => p.field === param.field
                    )?.selected;
            setSelectedNumericInputParam({ ...param, selected });
          }
        }}
      >
        <Typography textAlign="center" fontSize={14}>
          {value}
        </Typography>
      </Box>
      {/* {open && (
        <Box
          width={100}
          display="flex"
          justifyContent="center"
          flexWrap="wrap"
          alignItems="flex-start"
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translate(50%, -50%)',
            backgroundColor: theme.palette.background.default,
            zIndex: 100,
          }}
        >
          {inputValues.map((v) => (
            <Box
              width={40}
              height={40}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Typography textAlign="center" fontSize={14}>
                {v}
              </Typography>
            </Box>
          ))}
        </Box> */}
    </Box>
  );
}
