import { Box, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import NumericParamInputBox from './numeric-param-input-box';
import { core } from '@/core/core.service';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  param: ExerciseParamField;
  initValue: number;
  onInputChange: SetState<string>;
  disabled?: boolean;
}

export default function CustomNumberInput({
  initValue,
  disabled,
  param,
  onInputChange,
}: Props) {
  const screenSize = useScreenSize();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number>(initValue);
  const anchorEl = useRef<HTMLElement | null>(null);
  const valueBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setValue(initValue), [initValue]);

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
          onSubOptionChange={onInputChange}
          isFloat={core.exercise.param.get(param).float}
        />
      )}
    </Box>
  );
}
