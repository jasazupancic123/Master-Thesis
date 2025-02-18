import { SxProps, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers';
import React from 'react';
import { useScreenSize } from '@/context/screen-size-provider';

interface Props {
  items: { label: string; value: string; sublabel?: string }[];
  value: string;
  setValue: (value: string) => void;
  arrows?: boolean;
  onArrowClick?: (direction: 'left' | 'right') => void;
  getBackgroundColor?: (value: string, itemValue: string) => string;
  sx?: SxProps;
}

export default function Circles(props: Props) {
  const screenSize = useScreenSize();
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
          backgroundColor: '#1A2B3C',
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
              onClick={() => props.onArrowClick?.('left')}
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
                  onClick={() => props.setValue(item.value)}
                  sx={{
                    width: !screenSize.isDesktop ? 30 : 40,
                    height: !screenSize.isDesktop ? 30 : 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    backgroundColor: props.getBackgroundColor
                      ? props.getBackgroundColor(props.value, item.value)
                      : props.value === item.value
                        ? '#1EB980'
                        : 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    userSelect: 'none',
                  }}
                >
                  <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                    {item.label}
                  </Typography>
                </Box>
              </Tooltip>

              {item.sublabel && (
                <Typography variant="caption">{item.sublabel}</Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Right Arrow */}
        {props.arrows && (
          <Tooltip title="Next">
            <IconButton
              onClick={() => props.onArrowClick?.('right')}
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
