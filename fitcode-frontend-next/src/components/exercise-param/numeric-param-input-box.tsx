import { Box, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import type { SetState } from '@/lib/common/type/state.type';
import MyModal from '@/ui/modal';
import { ModalProps } from '@/lib/common/type/modal-props.type';
import { TrainingExercise } from '@/core/training/type/training-exercise.type';

interface Props extends ModalProps {
  value: number;
  onSubOptionChange: SetState<string>;
  exercise: TrainingExercise;
  setNumber?: number;
  param: string;
  isFloat?: boolean;
}

export default function NumericParamInputBoxModal(props: Props) {
  const {
    value,
    exercise,
    setNumber,
    param,
    onSubOptionChange,
    isFloat,
    open,
    setOpen,
  } = props;

  const [internalValue, setInternalValue] = useState<number>(value);

  const updateValue = (newValue: number) => {
    if (newValue < 0) return;

    onSubOptionChange(newValue.toString());
  };

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      onCancel={() => {
        setOpen(false);
      }}
      cancelText="Close"
      onConfirm={() => {
        updateValue(internalValue);
        setOpen(false);
      }}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
      >
        <Typography variant="h6">
          {exercise.exercise?.name || 'Unknown Exercise'}
        </Typography>
        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={4}
        >
          {setNumber !== undefined && (
            <Typography variant="subtitle1">Set {setNumber}</Typography>
          )}
          {setNumber !== undefined && (
            <Typography variant="subtitle1">{param}</Typography>
          )}
        </Box>
        <TextField
          type="number"
          fullWidth
          size="small"
          autoFocus
          label="Enter value"
          focused
          value={internalValue}
          onChange={(e) => {
            const inputValue = e.target.value;
            const parsedValue = isFloat
              ? parseFloat(inputValue)
              : parseInt(inputValue, 10);

            setInternalValue(parsedValue);
          }}
        />
      </Box>
    </MyModal>
  );
}
