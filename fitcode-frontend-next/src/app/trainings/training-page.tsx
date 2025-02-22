'use client';

import { CommonService } from '@/common/service/common.service';
import AthleteTrainingExerciseCard from '@/components/athlete-trainings/athlete-training-exercise-card';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, Stack, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { endOfDay, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { TrainingPageProps } from './type';

const commonService = CommonService.instance;

export default function TrainingPage(props: TrainingPageProps) {
  const screenSize = useScreenSize();
  const { token, trainings: allTrainings } = props;

  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState(() =>
    allTrainings.filter(({ from }) =>
      commonService.date.isBetween(from, startOfDay(from), endOfDay(from))
    )
  );

  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(
    dayjs(new Date())
  );

  useEffect(() => {
    if (!selectedDate) return;

    setTrainings(
      allTrainings.filter(({ from }) =>
        commonService.date.isBetween(
          from,
          startOfDay(selectedDate.toDate()),
          endOfDay(selectedDate.toDate())
        )
      )
    );

    setLoading(false);
  }, [selectedDate]);

  return loading ? (
    <>Loading...</>
  ) : (
    <Box display="flex" flexDirection="column" alignItems="center" pb={10}>
      <Box width={screenSize.isSmallerThanLaptop ? 120 : 160} pt={4}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => {
              if (!newDate) return;
              setSelectedDate(newDate);
            }}
            sx={{ textAlign: 'center' }}
            closeOnSelect={true}
            format="DD-MMM-YYYY"
          />
        </LocalizationProvider>
      </Box>

      {/* Trainings */}
      <Stack sx={{ borderRadius: 2, width: '100%' }}>
        <Box
          display="flex"
          width="100%"
          justifyContent="center"
          flexDirection="column"
        >
          {trainings.length === 0 ? (
            <Typography variant="h6" sx={{ pt: 2 }}>
              No trainings scheduled for this day
            </Typography>
          ) : (
            trainings.map((training, i) => (
              <Box
                key={i}
                sx={{
                  borderRadius: 2,
                  p: screenSize.isMobile ? 1 : 3,
                  pt: screenSize.isMobile ? 3 : undefined,
                  pb: 0,
                  minWidth: screenSize.isSmallerThanLaptop ? undefined : 1000,
                }}
              >
                {/* Training Time Header */}
                <Stack direction="row" sx={{ borderRadius: 5 }}>
                  <Box
                    sx={{
                      width: 25,
                      height: 25,
                      backgroundColor: 'background.default',
                      borderTopLeftRadius: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 3,
                    }}
                  />

                  <Stack
                    direction="row"
                    sx={{
                      backgroundColor: '#025c59',
                      px: 1,
                      borderTopRightRadius: 5,
                      justifyContent: screenSize.isMobile
                        ? 'flex-start'
                        : undefined,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {CommonService.instance.date.formatTime(
                        dayjs(training.from)
                      )}{' '}
                      -{' '}
                      {CommonService.instance.date.formatTime(
                        dayjs(training.to)
                      )}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Components */}
                <Stack spacing={3}>
                  <AthleteTrainingExerciseCard
                    token={token}
                    components={training.components}
                    training={training}
                  />
                </Stack>
              </Box>
            ))
          )}
        </Box>
      </Stack>
    </Box>
  );
}
