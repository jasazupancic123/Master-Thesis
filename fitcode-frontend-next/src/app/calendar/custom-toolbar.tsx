import React from 'react';
import { ToolbarProps } from 'react-big-calendar';
import { Box, Button } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { CalendarEvent } from './calendar-event';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useScreenSize } from '@/context/screen-size-provider';

const CustomToolbar: React.FC<ToolbarProps<CalendarEvent, object>> = ({
  label,
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
          maxHeight: screenSize.isLandscapeMobile ? 19 : undefined,
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
          maxHeight: screenSize.isLandscapeMobile ? 19 : undefined,
          maxWidth: screenSize.isLandscapeMobile ? 25 : undefined,
        }}
      >
        Next
      </Button>
    </Box>
  );
};

export default CustomToolbar;
