'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import CustomToolbar from './custom-toolbar';
import withAuth from '@/common/components/with-auth';
import { UserRole } from '@/user/enum/user-role.enum';
import { useAppContext } from '@/context/app-provider';
import CalendarDayModal from './calendar-day-modal';
import {
  Calendar,
  momentLocalizer,
  dateFnsLocalizer,
  Event,
  ToolbarProps,
  View,
  NavigateAction,
} from 'react-big-calendar';
import { Training } from '@/training/entity/training.entity';
import moment from 'moment';
import { useTheme } from '@mui/material/styles';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import toast from 'react-hot-toast';
import { CalendarEvent } from './calendar-evet';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.css';
import { TrainingController } from '@/training/training.controller';
import { useMediaQuery } from '@mui/material';
import { useScreenSize } from '@/context/screen-size-provider';

const events = [
  {
    title: 'Strength Training',
    start: new Date(2025, 0, 30, 10, 0), // Jan 30, 2025, 10:00 AM
    end: new Date(2025, 0, 30, 11, 30), // Jan 30, 2025, 11:30 AM
  },
  {
    title: 'Endurance Training',
    start: new Date(2025, 0, 31, 7, 0), // Jan 31, 2025, 7:00 AM
    end: new Date(2025, 0, 31, 8, 0), // Jan 31, 2025, 8:00 AM
  },
  {
    title: 'Speed Training',
    start: new Date(2025, 0, 31, 12, 0), // Jan 31, 2025, 12:00 PM
    end: new Date(2025, 0, 31, 13, 0), // Jan 31, 2025, 1:00 PM
  },
  {
    title: 'Coordination Training',
    start: new Date(2025, 0, 28, 12, 0), // Jan 31, 2025, 12:00 PM
    end: new Date(2025, 0, 28, 13, 0), // Jan 31, 2025, 1:00 PM
  },
];

function Page() {
  const { token } = useAppContext();
  const localizer = momentLocalizer(moment);
  const theme = useTheme();
  const screenSize = useScreenSize();

  const [currentDate, setCurrentDate] = useState(new Date()); // Track current month
  const [trainings, setTrainings] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle navigation (next & back)
  const handleNavigate = (
    newDate: Date,
    _view: View,
    action: NavigateAction
  ) => {
    if (action === 'NEXT') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (action === 'PREV') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate(new Date()); // Reset to today
    }
  };

  useEffect(() => {
    async function fetchActiveCycleTrainings() {
      //fetch trainings for the current athlete
      setTrainings(events); //mock data
    }

    fetchActiveCycleTrainings().then();
  }, [token]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        [theme.breakpoints.down('sm')]: {
          color: theme.palette.background.paper,
          alignItems: 'center',
          justifyContent: 'center',
          margin: 1,
        },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '90%',
          height: '75vh',
          maxWidth: '1200px',
          marginTop: screenSize.isLandscapeMobile ? 1 : 5,
          padding: screenSize.isLandscapeMobile ? 1 : 3,
          backgroundColor: theme.palette.background.paper, // Match card background
          borderRadius: 2,
          [theme.breakpoints.down('sm')]: {
            marginTop: 0,
            width: '100%',
            padding: 0,
            borderRadius: 10,
            height: '80vh',
          },
        }}
        style={
          {
            '--off-range-bg-color': theme.palette.background.default,
            '--btn-text-color': theme.palette.text.primary,
            '--btn-bg-color': theme.palette.primary.dark,
            '--today-bg-color': theme.palette.primary.dark,
            '--event-bg-color': theme.palette.info.dark,
          } as React.CSSProperties
        }
      >
        <Calendar
          localizer={localizer}
          events={trainings}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          style={{
            height: '100%',
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper,
            fontSize: screenSize.isLandscapeMobile ? '0.7rem' : undefined,
            borderRadius: '10px',
            paddingLeft: '5%',
            paddingRight: '5%',
            paddingTop: '0',
            padding: screenSize.isLandscapeMobile ? 0 : undefined,
          }}
          views={['month', 'week', 'day']}
          defaultView="month"
          selectable
          onNavigate={handleNavigate}
          onSelectEvent={(event) => setIsModalOpen(true)}
          components={{
            toolbar: CustomToolbar as React.ComponentType<
              ToolbarProps<CalendarEvent, object>
            >,
          }}
        />

        <CalendarDayModal
          data={{} as Training}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      </Paper>
    </Box>
  );
}

export default withAuth(Page, [UserRole.ATHLETE]);
