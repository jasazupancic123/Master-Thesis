import { VideoLibrary } from '@mui/icons-material';
import { alpha, Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import TrainingInProgressExerciseControls from './exercise-controls';
import ExerciseVideoModal from './modals/exercise-video-modal';
import TrainingInProgressExerciseSet from './training-in-progress-exercise-set';
import MobileMovementValidation from '@/components/mobile-movement-validation/mobile-movement-validation';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgressExerciseCard() {
  const theme = useTheme();

  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { trainingInProgress } = trainingContext;

  const {
    selectedExercise,
    setSelectedExercise,
    supersetIndex,
    setIndex,
    setSetIndex,
  } = trainingInProgressContext;

  const { selectedTrackingMethod, setSelectedTrackingMethod } =
    useAthleteHeader();

  const [openVideoModal, setOpenVideoModal] = useState(false);

  if (!trainingInProgress || !selectedExercise) return null;

  return selectedTrackingMethod === TrackingMethod.CAMERA ? (
    <MobileMovementValidation
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
          justifyContent="center"
          sx={{
            overflowX: 'auto',
            mx: 'auto',
          }}
        >
          {selectedExercise.sets.map((s, i) => {
            const isSetDone = trainingInProgress.exerciseSetTrackingState.some(
              (state) =>
                state.exerciseId === selectedExercise.id &&
                state.completedSetNumbers.some(
                  (set) => set.setNumber === s.setNumber
                )
            );

            return (
              <Box
                key={i}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="center"
                gap={0.5}
              >
                <Box
                  maxWidth="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    overflowX: 'auto',
                    mx: 'auto',
                    border: `1px solid ${theme.palette.primary.main}`,
                    borderLeft: i === 0 ? undefined : 'none',
                    borderRight:
                      i === selectedExercise.sets.length - 1
                        ? undefined
                        : 'none',
                    borderTopLeftRadius: i === 0 ? '4px' : 0,
                    borderBottomLeftRadius: i === 0 ? '4px' : 0,
                    borderTopRightRadius:
                      i === selectedExercise.sets.length - 1 ? '4px' : 0,
                    borderBottomRightRadius:
                      i === selectedExercise.sets.length - 1 ? '4px' : 0,
                    py: 0.3,
                    pr: i === selectedExercise.sets.length - 1 ? 0.25 : 0,
                    pl: i === 0 ? 0.25 : 0,
                  }}
                >
                  <Typography
                    fontSize={13}
                    textAlign="center"
                    fontWeight="bold"
                    sx={{
                      position: 'relative',
                      px: 2.5,
                      py: 0.25,
                      lineHeight: 1,
                      cursor: 'pointer',
                      color: isSetDone
                        ? theme.palette.text.secondary
                        : undefined,
                      backgroundColor: isSetDone
                        ? theme.palette.primary.main
                        : undefined,
                      borderTopLeftRadius: i === 0 ? '2px' : 0,
                      borderBottomLeftRadius: i === 0 ? '2px' : 0,
                      borderTopRightRadius:
                        i === selectedExercise.sets.length - 1 ? '2px' : 0,
                      borderBottomRightRadius:
                        i === selectedExercise.sets.length - 1 ? '2px' : 0,
                      textTransform: 'uppercase',
                    }}
                    onClick={() => {
                      setSetIndex(i);
                    }}
                  >
                    Set {i + 1}
                  </Typography>
                </Box>
                <Box
                  component="img"
                  src="/blinking_dot.gif"
                  alt="active set"
                  sx={{
                    width: 12,
                    height: 12,
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    visibility: setIndex === i ? 'visible' : 'hidden',
                  }}
                />
              </Box>
            );
          })}
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
