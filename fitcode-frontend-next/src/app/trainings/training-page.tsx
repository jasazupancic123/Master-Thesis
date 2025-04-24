'use client';

import { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import Animation from '@/components/animation';
import AthleteTrainingExerciseCard from '@/components/athlete-trainings/athlete-training-exercise-card';
import TrainingInProgress from '@/components/athlete-trainings/training-in-progress';
import { useAthlete } from '@/context/athlete-provider';
import { useAuth } from '@/context/auth-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTraining } from '@/context/training-provider';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingStatus } from '@/controller/training/type/training.type';
import { Box, Stack, Typography } from '@mui/material';
import { endOfDay, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TrainingPageProps } from './type';
import { useTheme } from '@mui/material';

const commonService = CommonService.instance;

export default function TrainingPage(props: TrainingPageProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const { profile, token, trainings: allTrainings } = props;
  const { selectedDate } = useAthlete();
  const { hasJustLoggedIn, setHasJustLoggedIn } = useAuth();

  const [trainings, setTrainings] = useState(() =>
    allTrainings.filter(({ from }) =>
      commonService.date.isBetween(from, startOfDay(from), endOfDay(from))
    )
  );

  const { view, setView } = useTraining();
  const [statuses, setStatuses] = useState<TrainingStatus[]>([]);

  const {
    selectedTraining,
    selectedComponent,
    setSelectedComponent,
    clearTrainingState,
    isLoaded,
  } = useTraining();

  useEffect(() => {
    if (!isLoaded) return;
    if (selectedTraining && selectedComponent) {
      setView('training');
    } else {
      clearTrainingState();
    }
  }, [isLoaded]);

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
  }, [selectedDate]);

  useEffect(() => {
    async function getTrainingStatus() {
      for (const t of trainings)
        handleApiRequest(
          router,
          () => TrainingController.getTrainingStatus(token, t.id),
          (response) => {
            setStatuses((prev) => [...prev, ...response]);
          },
          undefined
        );
    }

    getTrainingStatus().then();
  }, [selectedTraining]);

  return view === 'exercises' ? (
    hasJustLoggedIn === true ? (
      <Animation
        text="CHECKING YOUR TRAINING PLAN"
        onEnd={() => setHasJustLoggedIn(false)}
      />
    ) : trainings.length === 0 ? (
      <Typography
        variant="h6"
        sx={{ pt: 2, textAlign: 'center', width: '100%' }}
      >
        No training scheduled
      </Typography>
    ) : (
      <Box mt={2} pb={10}>
        {trainings.map((training) => (
          <Box
            key={training.id}
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            pb={2}
            px={screenSize.isLandscapeMobile ? 4 : 1}
          >
            <Box
              display="flex"
              sx={{
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                backgroundColor: theme.palette.primary.main,
              }}
              py={0.5}
              px={2}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#fff',
                }}
              >
                {dayjs(training.from).format('A')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#fff',
                  ml: 1,
                }}
              >
                {dayjs(training.from).format('HH:MM')}
              </Typography>
            </Box>
            <Stack sx={{ borderRadius: 2, width: '100%' }}>
              <Box
                display="flex"
                width="100%"
                justifyContent="center"
                alignItems={!training ? 'center' : undefined}
                flexDirection="column"
              >
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
                      statuses={statuses}
                      components={training.components}
                      setView={setView}
                      training={training}
                      profile={profile}
                    />
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>
    )
  ) : (
    <TrainingInProgress
      selectedTraining={selectedTraining!}
      selectedComponent={selectedComponent!}
      profile={profile}
      token={token}
      setView={setView}
      setSelectedComponent={setSelectedComponent}
      statuses={statuses}
      setStatuses={setStatuses}
    />
  );
}
