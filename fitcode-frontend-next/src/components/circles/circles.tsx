import type { SxProps } from '@mui/material';
import { Tooltip } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React from 'react';
import toast from 'react-hot-toast';

import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';

interface Props {
  items: { label: string; value: string; sublabel?: string }[];
  value: string;
  setValue: (value: string) => void;
  arrows?: boolean;
  onArrowClick?: (direction: 'left' | 'right') => void;
  getBackgroundColor?: (value: string, itemValue: string) => string;
  sx?: SxProps;
  onlySelectedValueColored?: boolean;
}

export default function Circles(props: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const { detectedChanges, setDetectedChanges } = useGroup();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {/* Wrapper that keeps arrows and elements aligned in a row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: screenSize.isMobile ? 0 : 2,
          width: screenSize.isMobile ? '100%' : undefined,
          backgroundColor: theme.palette.background.paper,
          padding: screenSize.isMobile ? 0 : '8px 16px',
          borderBottomRightRadius: '20px',
          borderBottomLeftRadius: '20px',
          maxWidth: 1700,
          ...props.sx,
        }}
      >
        {/* Left Arrow */}
        {props.arrows && (
          <Tooltip
            title="Previous"
            sx={{ p: screenSize.isMobile ? 0 : undefined }}
          >
            <IconButton
              onClick={() => {
                if (detectedChanges) {
                  toast.error('Unsaved changes will be lost', {
                    icon: '⚠️',
                    duration: 2000,
                  });

                  setDetectedChanges(false);
                  return;
                }
                props.onArrowClick?.('left');
              }}
              sx={{
                p: screenSize.isMobile ? 0 : undefined,
                width: !screenSize.isDesktop ? 30 : 40,
                height: !screenSize.isDesktop ? 30 : 40,
                flexShrink: 0, // Prevents shrinking
              }}
            >
              <ArrowLeftIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Items container (allows wrapping) */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap', // Ensures items wrap when needed
            gap: 2,
            justifyContent: 'center',
          }}
        >
          {props.items.map((item, i) => (
            <Box key={i}>
              <Tooltip title={item.label}>
                <Box
                  onClick={() => {
                    if (detectedChanges) {
                      toast.error('Unsaved changes will be lost', {
                        icon: '⚠️',
                        duration: 1000,
                      });

                      setDetectedChanges(false);
                      return;
                    }
                    props.setValue(item.value);
                  }}
                  sx={{
                    width: !screenSize.isDesktop ? 35 : 40,
                    height: !screenSize.isDesktop ? 35 : 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    backgroundColor: props.getBackgroundColor
                      ? props.getBackgroundColor(props.value, item.value)
                      : props.value === item.value
                        ? theme.palette.primary.main
                        : 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    userSelect: 'none',
                  }}
                >
                  <Typography sx={{ fontSize: '0.9rem' }}>
                    {item.label}
                  </Typography>
                </Box>
              </Tooltip>

              {item.sublabel && (
                <Typography
                  variant="caption"
                  sx={{
                    color: props.onlySelectedValueColored
                      ? !dayjs(new Date(props.value)).isSame(
                          new Date(item.value),
                          'day'
                        )
                        ? theme.palette.grey[500]
                        : undefined
                      : undefined,
                  }}
                >
                  {item.sublabel}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Right Arrow */}
        {props.arrows && (
          <Tooltip title="Next">
            <IconButton
              onClick={() => {
                if (detectedChanges) {
                  toast.error('Unsaved changes will be lost', {
                    icon: '⚠️',
                    duration: 1000,
                  });

                  setDetectedChanges(false);
                  return;
                }
                props.onArrowClick?.('right');
              }}
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0, // Prevents shrinking
              }}
            >
              <ArrowRightIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
