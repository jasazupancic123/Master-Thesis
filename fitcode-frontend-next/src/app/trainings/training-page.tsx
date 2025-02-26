'use client';

import { CommonService } from '@/common/service/common.service';
import AthleteTrainingExerciseCard from '@/components/athlete-trainings/athlete-training-exercise-card';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { endOfDay, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { TrainingPageProps } from './type';
import { useAthlete } from '@/context/athlete-provider';
import { Training } from '@/controller/training/type/training.type';
import Logo from '@/components/logo';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import TrainingInProgress from '@/components/athlete-trainings/training-in-progress';
import Animation from '@/components/animation';
import { useAuth } from '@/context/auth-provider';
import { useTraining } from '@/context/training-provider';

const commonService = CommonService.instance;

export default function TrainingPage(props: TrainingPageProps) {
  const screenSize = useScreenSize();
  const { profile, token, trainings: allTrainings } = props;
  const { selectedDate } = useAthlete();
  const { hasJustLoggedIn, setHasJustLoggedIn } = useAuth();

  const [trainings, setTrainings] = useState(() =>
    allTrainings.filter(({ from }) =>
      commonService.date.isBetween(from, startOfDay(from), endOfDay(from))
    )
  );

  const { view, setView } = useTraining();

  const {
    trainingResult,
    selectedTraining,
    setSelectedTraining,
    selectedComponent,
    setSelectedComponent,
    clearTrainingState,
    isLoaded,
  } = useTraining();

  useEffect(() => {
    if (!isLoaded) return;
    if (trainingResult && selectedTraining && selectedComponent) {
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
                backgroundColor: '#1EB980',
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
    />
  );
}
