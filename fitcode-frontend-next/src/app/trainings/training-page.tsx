'use client';

import { CommonService } from '@/common/service/common.service';
import AthleteTrainingExerciseCard from '@/components/athlete-trainings/athlete-training-exercise-card';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { endOfDay, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { TrainingPageProps } from './type';
import { useAthlete } from '@/context/athlete-provider';
import { Training } from '@/controller/training/type/training.type';
import Logo from '@/components/logo';

const commonService = CommonService.instance;

export default function TrainingPage(props: TrainingPageProps) {
  const screenSize = useScreenSize();
  const { userId, token, trainings: allTrainings } = props;
  const { selectedDate, selectedPeriod, hasJustLoggedIn, setHasJustLoggedIn } =
    useAthlete();

  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 10 : prevProgress + 10
      );
    }, 800);
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (progress === 100) {
      setHasJustLoggedIn(false);
    }
  }, [progress]);

  useEffect(() => {
    if (!selectedDate) return;

    setSelectedTraining(
      allTrainings.filter(
        ({ from }) =>
          (commonService.date.isSameDay(dayjs(from), selectedDate) &&
            selectedPeriod === 'AM' &&
            dayjs(from).hour() < 12) ||
          (selectedPeriod === 'PM' && dayjs(from).hour() >= 12)
      )[0] || null
    );
  }, [selectedDate, selectedPeriod]);

  return hasJustLoggedIn === true ? (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      height="50vh"
      justifyContent="center"
      alignItems="center"
    >
      <Logo width={260} height={175} version="narrow" sx={{}} />
      <div className="flex flex-col items-center justify-center h-screen bg-gray-800">
        <p className="text-gray-300 text-lg font-bold tracking-wider uppercase mb-2">
          CHECKING YOUR TRAINING PLAN
        </p>
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </Box>
  ) : (
    <Box display="flex" flexDirection="column" alignItems="center" pb={10}>
      {/* Trainings */}
      <Stack sx={{ borderRadius: 2, width: '100%' }}>
        <Box
          display="flex"
          width="100%"
          justifyContent="center"
          alignItems={!selectedTraining ? 'center' : undefined}
          flexDirection="column"
        >
          {!selectedTraining ? (
            <Typography variant="h6" sx={{ pt: 2 }}>
              No training scheduled
            </Typography>
          ) : (
            <Box
              width="100%"
              sx={{
                borderRadius: 2,
                pt: 0,
              }}
            >
              {/* Components */}
              <Stack spacing={3}>
                <AthleteTrainingExerciseCard
                  userId={userId}
                  token={token}
                  components={selectedTraining.components}
                  training={selectedTraining}
                />
              </Stack>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
