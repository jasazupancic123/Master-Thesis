'use client';

import { Grid, IconButton, Typography } from '@mui/material';
import { Box } from '@mui/material';

import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardPageContainer from './dashboard-page-container';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { useMain } from '@/store/main.provider';
import useTodaysComponents from '../dashboard-home/hooks/use-todays-components';
import { useDashboard } from '@/store/dashboard.provider';
import TrainingComponentDashboardCard from '../dashboard-home/training-component-dashboard-card';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import DashboardGroupFilter from './dashboad-group-filter';
import { theme } from '@/app/style';
import { ArrowLeft, ArrowRight, EventOutlined } from '@mui/icons-material';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function DashboardSchedule() {
  const { institution, trainings } = useMain();

  const { filteredGroups } = useDashboard();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { todayComponents } = useTodaysComponents(
    filteredGroups || [],
    trainings.data,
    selectedDate
  );

  if (!institution) return null;

  return (
    <DashboardPageContainer>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          width="100%"
          height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
          maxWidth={MAX_WIDTH}
        >
          <Box display="flex" alignItems="center">
            <IconButton
              sx={{ p: 0, m: 0 }}
              onClick={() => {
                setSelectedDate((prev) =>
                  dayjs(prev).subtract(1, 'day').toDate()
                );
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography
              width={90}
              variant="h5"
              fontWeight={600}
              sx={{
                color: theme.palette.primary.main,
              }}
            >
              {dayjs(selectedDate).isSame(new Date(), 'day')
                ? 'Today'
                : dayjs(selectedDate).format('DD MMM')}
            </Typography>
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={(newValue) => {
                if (!newValue) return;
                setSelectedDate(newValue.toDate());
              }}
              slots={{
                openPickerIcon: EventOutlined,
              }}
              slotProps={{
                textField: {
                  variant: 'standard',
                  sx: {
                    width: 40,
                    '& .MuiInputBase-root': { p: 0 },
                    '& .MuiInputBase-input': {
                      width: 0,
                      p: 0,
                    },
                    '& .MuiPickersSectionList-sectionContent': {
                      color: 'transparent',
                    },
                  },
                  InputProps: { disableUnderline: true },
                },
                day: {
                  sx: {
                    '&.MuiPickersDay-today': {
                      borderRadius: 2, // rounded corners
                      border: '2px solid', // uses currentColor unless you set a color
                    },
                  },
                },
                // this is the actual IconButton that opens the picker
                openPickerButton: {
                  sx: { p: 0, m: 0 },
                },
                popper: {
                  placement: 'bottom-start',
                },
              }}
            />

            <IconButton
              sx={{ p: 0, m: 0 }}
              onClick={() => {
                setSelectedDate((prev) => dayjs(prev).add(1, 'day').toDate());
              }}
            >
              <ArrowRight />
            </IconButton>
          </Box>
          <DashboardGroupFilter />
        </Box>

        {!todayComponents.length ? (
          <Typography>No sessions on this date</Typography>
        ) : (
          <Grid width={'100%'} container spacing={2} maxWidth={MAX_WIDTH}>
            {todayComponents.map((component, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <TrainingComponentDashboardCard component={component} />
              </Grid>
            ))}
          </Grid>
        )}
      </LocalizationProvider>
    </DashboardPageContainer>
  );
}
