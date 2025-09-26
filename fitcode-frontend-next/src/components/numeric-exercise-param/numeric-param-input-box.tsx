import { AddOutlined, RemoveOutlined } from '@mui/icons-material';
import { Box, ClickAwayListener, Popper, Typography } from '@mui/material';
import { useState } from 'react';

import { theme } from '@/app/style';
import type { SetState } from '@/common/type/state.type';

interface NumericParamInputBoxProps {
  anchorEl: HTMLElement | null;
  value: number;
  setOpen: (open: boolean) => void;
  open: boolean;
  onSubOptionChange: SetState<string>;
  isFloat?: boolean;
}

export default function NumericParamInputBox(props: NumericParamInputBoxProps) {
  const { anchorEl, value, open, setOpen, onSubOptionChange, isFloat } = props;

  const [isNegative, setIsNegative] = useState(false);

  const inputValues = !isFloat
    ? [1, 2, 5, 10, 20, 50]
    : [0.25, 0.5, 1, 2, 5, 10, 20, 50];

  const handleMenuClose = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (t?.id?.startsWith('numeric-input-')) return;

    if (t?.id === anchorEl?.id) {
      setOpen(false);
      return;
    }

    const path = (e.composedPath && e.composedPath()) || [];
    if (path.some((n) => (n as HTMLElement)?.id === 'numeric-input-popper'))
      return;

    setOpen(false);
  };

  const updateValue = (valueToAddOrSubtract: number) => {
    if (isNegative && valueToAddOrSubtract > 0)
      valueToAddOrSubtract = -valueToAddOrSubtract;

    const newValue = value + valueToAddOrSubtract;

    onSubOptionChange(newValue.toString());
  };

  return (
    <ClickAwayListener
      onClickAway={(e) => {
        handleMenuClose(e as MouseEvent);
      }}
    >
      <Popper
        id="numeric-input-popper"
        open={open && anchorEl !== null}
        anchorEl={anchorEl}
        sx={{
          zIndex: 100000,
          position: 'relative',
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.primary.main}`,
            borderRadius: 2,
            p: 0.5,
          }}
        >
          <Box display="flex" alignItems="center">
            <Box
              width={30}
              height={30}
              onClick={() => setIsNegative(!isNegative)}
              sx={{
                backgroundColor: theme.palette.background.light,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 1,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  cursor: 'pointer',
                },
                position: 'relative',
                backgroundImage: `linear-gradient(
                  -45deg,
                  ${isNegative ? 'transparent' : theme.palette.background.default} calc(50% - 0.5px),
                  ${theme.palette.divider} calc(50% - 0.5px),
                  ${theme.palette.divider} calc(50% + 0.5px),
                  ${!isNegative ? 'transparent' : theme.palette.background.default} calc(50% + 0.5px)
                )`,
              }}
            >
              <AddOutlined
                sx={{
                  position: 'absolute',
                  top: '30%',
                  left: '30%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 14,
                  color: isNegative
                    ? theme.palette.text.primary
                    : theme.palette.primary.main,
                  opacity: isNegative ? 0.3 : 1,
                }}
              />
              <RemoveOutlined
                sx={{
                  position: 'absolute',
                  top: '70%',
                  left: '70%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 14,
                  color: isNegative
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                  opacity: isNegative ? 1 : 0.3,
                }}
              />
            </Box>
            <Box
              width={100}
              display="flex"
              justifyContent="center"
              flexWrap="wrap"
              alignItems="flex-start"
              sx={{
                px: 1,
              }}
              gap={0.5}
            >
              {inputValues.map((v) => (
                <Box
                  key={v}
                  width={40}
                  height={40}
                  component={Typography}
                  textAlign="center"
                  fontSize={13}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    backgroundColor: theme.palette.background.light,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 1,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      cursor: 'pointer',
                    },
                    userSelect: 'none',
                  }}
                  onClick={() => updateValue(v)}
                >
                  {isNegative ? '-' : ''}
                  {v}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Popper>
    </ClickAwayListener>
  );
}
