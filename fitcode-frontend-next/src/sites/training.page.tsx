'use client';

import { CommonService } from '@/common/service/common.service';
import Animation from '@/components/animation/animation';
import AthleteTrainingExerciseCard from '@/components/athlete-trainings-exercise-card/athlete-training-exercise-card';
import TrainingInProgress from '@/components/training-in-progress/training-in-progress';
import { useAthlete } from '@/store/athlete-provider';
import { useAuth } from '@/store/auth-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';
import { Training } from '@/controller/training/type/training.type';
import { Box, Stack, Typography } from '@mui/material';
import { endOfDay, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { User } from '@/controller/user/type/user.type';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';

const commonService = CommonService.instance;

export type TrainingPageProps = {
  userId: string;
  token: string;
  profile: User;
  trainings: Training[];
};

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
      setView(ExerciseTrainingView.TrainingView);
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

  return view === ExerciseTrainingView.ExerciseView ? (
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
                      training={training}
                      profile={profile}
                      token={token}
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
      setAllTrainings={setAllTrainings}
    />
  );
}
