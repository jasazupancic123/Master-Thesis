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
import { CheckCircle } from '@mui/icons-material';
import { all } from '@tensorflow/tfjs';

const commonService = CommonService.instance;

export default function TrainingPage(props: TrainingPageProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const { profile, token, trainings: allTrainingsProps } = props;
  const { selectedDate } = useAthlete();
  const { hasJustLoggedIn, setHasJustLoggedIn } = useAuth();

  const [allTrainings, setAllTrainings] = useState([...allTrainingsProps]);
  const [trainings, setTrainings] = useState(() =>
    allTrainings.filter(({ from }) =>
      commonService.date.isBetween(from, startOfDay(from), endOfDay(from))
    )
  );

  const { view, setView } = useTraining();

  const { clearTrainingState, trainingInProgress, isLoaded } = useTraining();

  useEffect(() => {
    if (!isLoaded) return;
    if (
      trainingInProgress &&
      trainingInProgress.training &&
      trainingInProgress.selectedComponent
    ) {
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
    setAllTrainings((prev) => {
      const newTrainings = prev.map((training) => {
        trainings.map((t) => {
          if (t.id === training.id) {
            training = t;
          }
        });
        return training;
      });
      return newTrainings;
    });
  }, [trainings]);

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
                backgroundColor: training.completedMembersIds.includes(
                  profile.uid
                )
                  ? theme.palette.primary.dark
                  : theme.palette.primary.main,
              }}
              alignItems="center"
              py={0.5}
              px={2}
              gap={1}
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
                }}
              >
                {dayjs(training.from).format('HH:MM')}
              </Typography>

              {training.completedMembersIds.includes(profile.uid) && (
                <CheckCircle
                  sx={{
                    color: theme.palette.primary.light,
                  }}
                />
              )}
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
                      components={[
                        training.warmup,
                        ...training.components,
                        training.cooldown,
                      ]}
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
      profile={profile}
      token={token}
      setView={setView}
      setTrainings={setTrainings}
    />
  );
}
