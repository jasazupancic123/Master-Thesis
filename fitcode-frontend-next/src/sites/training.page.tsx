'use client';

import { CommonService } from '@/common/service/common.service';
import Animation from '@/components/animation/animation';
import AthleteTrainingCard from '@/components/athlete-training-card/athlete-training-card';
import TrainingInProgress from '@/components/training-in-progress/training-in-progress';
import { useAuth } from '@/store/auth-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';
import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import { useMain } from '@/store/main-provider';
import { CompletedPlanned } from '@/common/enum/past-future.enum';

const commonService = CommonService.instance;

export default function TrainingPage() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { profile } = useMain();
  const {
    view,
    setView,
    trainings: allTrainingsProps,
    clearTrainingState,
    trainingInProgress,
    isLoaded,
  } = useTraining();

  const { hasJustLoggedIn, setHasJustLoggedIn } = useAuth();

  const [allTrainings, setAllTrainings] = useState([...allTrainingsProps]);
  const [trainings, setTrainings] = useState([...allTrainingsProps]);
  const [completedOrPlanned, setCompletedOrPlanned] =
    useState<CompletedPlanned>(CompletedPlanned.PLANNED);

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
    ) : (
      <Box display="flex" flexDirection="column" width="100%">
        <Box
          display="flex"
          justifyContent="space-evenly"
          sx={{
            backgroundColor: theme.palette.background.light,
            py: 1,
          }}
        >
          {[CompletedPlanned.COMPLETED, CompletedPlanned.PLANNED].map(
            (type) => (
              <Box key={type} display="flex" flexDirection="column">
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}
                  onClick={() => {
                    setCompletedOrPlanned(type);
                  }}
                >
                  {type}
                </Typography>
                {type === completedOrPlanned && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 2,
                      borderRadius: 2,
                      backgroundColor: theme.palette.primary.main,
                    }}
                  />
                )}
              </Box>
            )
          )}
        </Box>
        <Box pb={6}>
          {trainings.map((training) => (
            <AthleteTrainingCard key={training.id} training={training} />
          ))}
        </Box>
      </Box>
    )
  ) : (
    <TrainingInProgress
      setView={setView}
      setTrainings={setTrainings}
      setAllTrainings={setAllTrainings}
    />
  );
}
