import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import React from 'react';
import type { ToolbarProps } from 'react-big-calendar';

import type { CalendarEvent } from '@/common/type/calendar-event-type';
import { useScreenSize } from '@/store/screen-size-provider';

const CustomToolbar: React.FC<ToolbarProps<CalendarEvent, object>> = ({
  date,
  onNavigate,
}) => {
  const screenSize = useScreenSize();
  const theme = useTheme();

  let formattedLabel = format(date, 'MMM. yyyy').toUpperCase();
  if (formattedLabel.split(' ')[1] === new Date().getFullYear().toString()) {
    formattedLabel = formattedLabel.split(' ')[0];
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: screenSize.isLandscapeMobile ? 1 : '10px',
        [theme.breakpoints.down('sm')]: {
          backgroundColor: theme.palette.background.default,
        },
        maxHeight: screenSize.isLandscapeMobile ? 30 : undefined,
      }}
    >
      {/* Back Button */}
      <Button
        onClick={() => onNavigate('PREV')}
        startIcon={<ArrowBack />}
        variant="contained"
        sx={{
          maxHeight: screenSize.isLandscapeMobile
            ? 19
            : screenSize.isMobile
              ? 25
              : undefined,
          maxWidth: screenSize.isLandscapeMobile ? 25 : undefined,
        }}
      >
        Back
      </Button>

      {/* Current Month & Year */}
      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
        {formattedLabel}
      </span>

      {/* Next Button */}
      <Button
        onClick={() => onNavigate('NEXT')}
        endIcon={<ArrowForward />}
        variant="contained"
        sx={{
          maxHeight: screenSize.isLandscapeMobile
            ? 19
            : screenSize.isMobile
              ? 25
              : undefined,
          maxWidth: screenSize.isLandscapeMobile ? 25 : undefined,
        }}
      >
        Next
      </Button>
    </Box>
  );
};

export default CustomToolbar;
