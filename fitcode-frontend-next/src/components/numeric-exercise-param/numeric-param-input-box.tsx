import { theme } from '@/app/style';
import { useSupersets } from '@/store/supersets.provider';
import { AddOutlined, Remove, RemoveOutlined } from '@mui/icons-material';
import {
  Popper,
  Box,
  Typography,
  ClickAwayListener,
  Paper,
} from '@mui/material';
import { useState } from 'react';

export default function NumericParamInputBox() {
  const supersetsContext = useSupersets();

  const {
    openNumericInput,
    setOpenNumericInput,
    numericInputAnchorEl,
    setNumericInputAnchorEl,
    selectedNumericInputParam,
    setSelectedNumericInputParam,
  } = supersetsContext || {};

  const [isNegative, setIsNegative] = useState(false);

  const inputValues = [0.25, 0.5, 1, 2, 5, 10, 20, 50];

  const handleMenuClose = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (t?.id?.startsWith('numeric-input-')) return;

    const path = (e.composedPath && e.composedPath()) || [];
    if (path.some((n) => (n as HTMLElement)?.id === 'numeric-input-popper'))
      return;

    setOpenNumericInput && setOpenNumericInput(false);
    setNumericInputAnchorEl && setNumericInputAnchorEl(null);
    setSelectedNumericInputParam && setSelectedNumericInputParam(null);
  };

  return (
    <ClickAwayListener
      onClickAway={(e) => {
        handleMenuClose(e as MouseEvent);
      }}
    >
      <Popper
        id="numeric-input-popper"
        disablePortal
        open={openNumericInput && Boolean(numericInputAnchorEl)}
        anchorEl={numericInputAnchorEl}
        sx={{
          zIndex: 1000,
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
          <Typography textAlign="center">
            {selectedNumericInputParam?.selected &&
            selectedNumericInputParam?.selected.length
              ? selectedNumericInputParam.selected[0].toUpperCase() +
                selectedNumericInputParam.selected.slice(1)
              : ''}
          </Typography>
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
                // on hover
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  cursor: 'pointer',
                },
                position: 'relative',
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
                  fontSize={14}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    backgroundColor: theme.palette.background.light,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 1,
                    // on hover
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      cursor: 'pointer',
                    },
                    userSelect: 'none',
                  }}
                >
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
