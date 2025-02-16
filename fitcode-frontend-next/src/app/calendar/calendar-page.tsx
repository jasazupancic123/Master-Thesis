'use client';

import { useScreenSize } from '@/context/screen-size-provider';
import { Training } from '@/controller/training/type/training.type';
import { Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, ToolbarProps } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarDayModal from './calendar-day-modal';
import CustomToolbar from './custom-toolbar';
import { CalendarPageProps } from './props';
import { fetchAthleteTrainings, handleNavigate } from './state';
import './styles.css';
import { CalendarEvent } from './type';

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

export function CalendarPage(props: CalendarPageProps) {
  const { token } = props;

  const router = useRouter();
  const theme = useTheme();
  const localizer = momentLocalizer(moment);
  const screenSize = useScreenSize();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [trainings, setTrainings] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAthleteTrainings(
      token,
      { from: new Date(), to: new Date() },
      { router }
    ).then((_trainings) => {
      setTrainings(events);
    });
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
          onNavigate={() =>
            handleNavigate(new Date(), {} as any, '' as any, setCurrentDate)
          }
          onSelectEvent={() => setIsModalOpen(true)}
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
