import { Attribute } from '@/controller/attribute/type/attribute.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { Box, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import NumericParamInputBox from './numeric-param-input-box';
import { SetState } from '@/common/type/state.type';
import { IntType } from '@/controller/component/enum/param.enum';

interface NumericExerciseParamProps {
  initValue: number;
  param: Attribute;
  onSubOptionChange: SetState<string>;
  exercise?: TrainingExercise;
  disabled?: boolean;
}

export default function NumericExerciseParam(props: NumericExerciseParamProps) {
  const screenSize = useScreenSize();

  const { initValue, disabled, param, exercise, onSubOptionChange } = props;

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number>(initValue);
  const anchorEl = useRef<HTMLElement | null>(null);
  const valueBoxRef = useRef<HTMLDivElement | null>(null);

  const selected =
    exercise &&
    exercise.sets.length > 0 &&
    exercise.sets[0].paramValuesL.find((p) => p.field === param.field)
      ?.selected;

  const isFloat = (selected &&
    ([IntType.Kg, IntType.Vbt].includes(
      selected as IntType
    ) as boolean)) as boolean;

  useEffect(() => {
    setValue(initValue);
  }, [initValue]);

  return (
    <Box
      ref={anchorEl}
      width={screenSize.isUltraSmall ? 20 : 50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        py: 1,
        px: 2,
        zIndex: 10,
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Box
        ref={valueBoxRef}
        component={Typography}
        textAlign="center"
        fontSize={16}
        fontWeight={600}
        px={1}
        onClick={() => {
          if (disabled) return;

          setOpen((o) => !o);
        }}
      >
        {value}
      </Box>

      {open && (
        <NumericParamInputBox
          anchorEl={anchorEl.current}
          value={value}
          open={open}
          setOpen={setOpen}
          onSubOptionChange={onSubOptionChange}
          isFloat={isFloat}
        />
      )}
    </Box>
  );
}
