'use client';

import { CommonService } from '@/common/service/common.service';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, ToolbarProps } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CustomToolbar from './custom-toolbar';
import { CalendarPageProps } from './props';
import { fetchAthleteTrainings, handleNavigate } from './state';
import './styles.css';
import { CalendarEvent } from './type';

const commonService = CommonService.instance;

export function CalendarPage(props: CalendarPageProps) {
  const screenSize = useScreenSize();
  const { token } = props;

  const router = useRouter();
  const theme = useTheme();
  const localizer = momentLocalizer(moment);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [trainings, setTrainings] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    fetchAthleteTrainings(
      token,
      { from: firstDayOfMonth, to: lastDayOfMonth },
      { router }
    ).then((_trainings) => {
      if (!_trainings) return;
      const events = _trainings.map((training) => {
        const componentsIcons = [];
        for (const component of Object.values(training.components)) {
          const IconComponent = commonService.navigation.getComponentIcon(
            (component as any).id
          );
          componentsIcons.push(IconComponent);
        }

        return {
          title: screenSize.isSmallerThanLaptop
            ? dayjs(training.from).format('HH:mm')
            : `${dayjs(training.from).format('HH:mm')}-${dayjs(training.to).format('HH:mm')}`,
          start: new Date(training.from),
          end: new Date(training.to),
          icon: componentsIcons[0],
        };
      });

      setTrainings(events);
    });
  }, [token, screenSize.isSmallerThanLaptop, currentDate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        color: theme.palette.background.paper,
        alignItems: 'center',
        justifyContent: 'center',
        m: screenSize.isMobile ? 1 : undefined,
        pb: 10,
        overflowY: 'scroll',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '90%',
          height: '80vh',
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
            '--today-bg-color': theme.palette.background.paper,
            '--event-bg-color': theme.palette.primary.main,
            '--row-container-height': '25px',
            '--rbc-event-margin': '0',
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
          onNavigate={(newDate, view, action) =>
            handleNavigate(newDate, view, action, setCurrentDate)
          }
          components={{
            toolbar: CustomToolbar as React.ComponentType<
              ToolbarProps<CalendarEvent, object>
            >,
          }}
        />
      </Paper>
    </Box>
  );
}
