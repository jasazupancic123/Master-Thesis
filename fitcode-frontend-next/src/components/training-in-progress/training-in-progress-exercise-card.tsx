import { Add, VideoLibrary } from '@mui/icons-material';
import { alpha, Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import TrainingInProgressExerciseControls from './exercise-controls';
import ExerciseVideoModal from './modals/exercise-video-modal';
import TrainingInProgressExerciseSet from './training-in-progress-exercise-set';
import MobileMovementValidation from '@/components/mobile-movement-validation/mobile-movement-validation';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import TrainingExerciseSetBox from '@/ui/training-exercise-set-box';

export default function TrainingInProgressExerciseCard() {
  const { user } = useAuthenticatedAuth();

  const { activeTraining } = useMain();
  const theme = useTheme();
  const trainingContext = useTrainings();
  const trainingInProgressContext = useTrainingInProgress();
  const { edit } = useTrainingInProgressUtils();

  const {
    selectedExercise,
    setSelectedExercise,
    supersetIndex,
    setIndex,
    setSetIndex,
  } = trainingInProgressContext;
  const { trainingInProgress } = trainingContext;

  const { selectedTrackingMethod, setSelectedTrackingMethod } =
    useAthleteHeader();

  const [openVideoModal, setOpenVideoModal] = useState(false);

  if (!trainingInProgress || !selectedExercise) return null;

  return selectedTrackingMethod === TrackingMethod.CAMERA ? (
    <MobileMovementValidation
      userId={user.uid}
      selectedExercise={selectedExercise}
      setSelectedExercise={setSelectedExercise}
      selectedTrackingMethod={selectedTrackingMethod}
      setSelectedTrackingMethod={setSelectedTrackingMethod}
      trainingId={trainingInProgress.training.id}
      componentId={trainingInProgress.selectedComponent.id}
      supersetIndex={supersetIndex!}
      setIndex={setIndex!}
    />
  ) : (
    <Box
      width="100%"
      minHeight="80vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.default,
        pb: '50px',
      }}
    >
      {/* Image */}
      <Box position="relative">
        {selectedExercise.exercise?.videoUrl ? (
          <Box
            sx={{
              filter: 'grayscale(100%)',
            }}
          >
            <video
              muted
              playsInline
              controls={false}
              src={selectedExercise.exercise.videoUrl}
              poster={selectedExercise.exercise?.imageUrl || undefined}
              preload="metadata"
              style={{
                width: '100%',
                height: 'auto',
                padding: 12,
                borderRadius: 16,
              }}
            />
          </Box>
        ) : (
          <Image
            src={
              selectedExercise.exercise?.imageUrl || EXERCISE_DEFAULT_IMG_URL
            }
            alt={selectedExercise.exercise?.name || ''}
            width={0}
            height={0}
            sizes={'100vw'}
            unoptimized={lib.common.env.unoptimizeImages()}
            style={{
              maxWidth: '1200px',
              width: '100vw',
              height: 'auto',
              filter: 'grayscale(100%)',
              padding: 12,
              paddingTop: 6,
              borderRadius: 16,
            }}
          />
        )}

        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            backgroundColor: alpha(theme.palette.background.default, 0.75),
            py: 1.5,
          }}
        >
          <Typography
            width={selectedExercise.exercise?.videoUrl ? '80%' : '100%'}
            fontWeight={600}
            fontSize={20}
            lineHeight={1}
            textTransform="uppercase"
            color={theme.palette.primary.main}
            sx={{
              textAlign: 'center',
              overflow: 'hidden',
              zIndex: 1,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {selectedExercise.exercise?.name || 'Unnamed Exercise'}
          </Typography>
          <IconButton
            onClick={() => {
              setOpenVideoModal(true);
            }}
            sx={{
              p: 0,
              m: 0,
              position: 'absolute',
              right: 16,
              top: '48%',
              transform: 'translateY(-50%)',
            }}
          >
            <VideoLibrary fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Current tracking exercise set */}
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          backgroundColor: theme.palette.background.default,
          position: 'relative',
          py: 1,
        }}
      >
        <Box
          maxWidth="100%"
          display="flex"
          alignItems="center"
          sx={{
            overflowX: 'auto',
            mx: 'auto',
            px: 0.5,
          }}
        >
          {selectedExercise.sets.map((s, i) => {
            const isSetDone =
              supersetIndex !== undefined &&
              setIndex !== undefined &&
              activeTraining
                ? ExerciseSetService.isSetCompleted(
                    {
                      trainingId: trainingInProgress.training.id,
                      componentId: trainingInProgress.selectedComponent.id,
                      exerciseId: selectedExercise.id,
                      supersetIndex: supersetIndex,
                      setIndex: s.setNumber - 1,
                    },
                    activeTraining.workloads
                  )
                : false;

            const isSetSelected = setIndex === i;

            return (
              <TrainingExerciseSetBox
                key={i}
                selectedExercise={selectedExercise}
                setSetIndex={setSetIndex}
                setIndex={i}
                isSetSelected={isSetSelected}
                isSetDone={isSetDone}
              />
            );
          })}

          {edit && (
            <IconButton
              size="small"
              color="primary"
              onClick={async () => {
                await trainingInProgressContext.addSetToExercise();
              }}
              sx={{
                p: 0.5,
                m: 0,
                mb: 2,
                ml: 0.5,
                alignSelf: 'center',
                border: `1px solid ${theme.palette.primary.main}`,
              }}
            >
              <Add fontSize="small" />
            </IconButton>
          )}
        </Box>

        {setIndex !== undefined &&
          setIndex !== null &&
          selectedExercise.sets[setIndex] && (
            <Box
              width="100%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ px: 1.2, py: 0.5, position: 'relative' }}
            >
              <TrainingInProgressExerciseSet
                exercise={selectedExercise}
                setIndex={setIndex}
              />
            </Box>
          )}

        <TrainingInProgressExerciseControls />

        {selectedExercise.exercise?.videoUrl && (
          <ExerciseVideoModal
            open={openVideoModal}
            setOpen={setOpenVideoModal}
            videoUrl={selectedExercise.exercise.videoUrl}
          />
        )}
      </Box>
    </Box>
  );
}
