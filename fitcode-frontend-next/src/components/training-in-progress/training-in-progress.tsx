import { Circle } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Fab,
  Menu,
  LinearProgress,
  MenuItem,
  Typography,
} from '@mui/material';

import { linearProgressClasses } from '@mui/material';

import { useTheme } from '@mui/material';
import React, { useEffect } from 'react';

import AthleteOptionsContainer from '../athlete/athlete-options-container';
import { handleInitTrainingInProgressComponent } from './actions/actions-training-in-progress';
import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import CancelTrainingModal from './modals/cancel-training-modal';
import UndoneSetsErrorModal from './modals/undone-sets-error-modal';
import TrainingInProgressExerciseContainer from './training-in-progress-exercise-container';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { preloadPoseLandmarker } from '@/lib/pose-detection/util/pose-landmarker-loader.util';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import Image from 'next/image';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import dayjs from 'dayjs';

export default function TrainingInProgress() {
  const theme = useTheme();

  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();
  const trainingInProgressUtilsContext = useTrainingInProgressUtils();
  const athleteHeaderContext = useAthleteHeader();

  const { trainingInProgress } = trainingContext;

  const {
    supersetIndex,
    setSupersetIndex,
    selectedExercise,
    setSelectedExercise,
  } = trainingInProgressContext;

  const {
    anchorEl,
    open,
    handleOpenMenu,
    handleCloseMenu,
    handleCancel,
    formatTime,
    openCancelTrainingModal,
    setOpenCancelTrainingModal,
    showUndoneSetsError,
    setShowUndoneSetsError,
  } = trainingInProgressUtilsContext;

  const { selectedTrackingMethod } = athleteHeaderContext;

  /* Preload pose landmarker */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    preloadPoseLandmarker();
  }, []);

  /* Init training in progress for selected component */
  useEffect(() => {
    if (!trainingInProgress) return;

    handleInitTrainingInProgressComponent({
      useTraining: { ...trainingContext, trainingInProgress },
      useTrainingInProgressContext: trainingInProgressContext,
    });
  }, [trainingInProgress?.selectedComponent]);

  if (!trainingInProgress) return null;

  return (
    <Box
      id="training-in-progress-main"
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      {selectedTrackingMethod !== TrackingMethod.CAMERA && (
        <AthleteOptionsContainer
          items={['', '']}
          selectedItem={'none'}
          title={trainingInProgress.selectedComponent.id || ''}
          onClick={() => {}}
          startMs={dayjs(trainingInProgress.startOfTraining).valueOf()}
        />
      )}

      {selectedTrackingMethod !== TrackingMethod.CAMERA && (
        <Box
          display="flex"
          gap={1}
          px={1}
          pt={1}
          maxWidth="100%"
          sx={{
            overflowX: 'auto',
            mx: 'auto',
          }}
        >
          {(trainingInProgress.supersets || []).map((superset, i) => {
            const isSelected = supersetIndex === i; // <- key change

            return (
              <Box
                key={i}
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
              >
                <Typography
                  key={i}
                  fontSize={14}
                  fontWeight={isSelected ? 600 : undefined}
                  textAlign="center"
                  noWrap
                  sx={{
                    flex: '0 0 auto',
                    color: isSelected ? theme.palette.primary.main : undefined,
                  }}
                >
                  {isSelected && (
                    <Circle
                      sx={{
                        fontSize: 8,
                        verticalAlign: 'middle',
                        mr: 0.5,
                        mb: 0.2,
                      }}
                    />
                  )}
                  Block {i + 1}
                </Typography>
                <Box display="flex" justifyContent="center" gap={0.5}>
                  {superset.exercises.map((e) => {
                    const isSelected = selectedExercise?.id === e.id;

                    const exercise = e.exercise;

                    if (!exercise) return null;

                    const width = 75;
                    const height = 50;

                    const completedSetsTracking =
                      trainingInProgress.exerciseSetTrackingState.find(
                        (s) => s.exerciseId === e.id
                      );

                    const progress =
                      ((completedSetsTracking?.completedSetNumbers.length ||
                        0) /
                        e.sets.length) *
                      100;

                    return (
                      <Box
                        key={e.id}
                        onClick={() => {
                          const newSupersetIndex =
                            trainingInProgress.supersets.indexOf(superset);

                          if (newSupersetIndex === -1) return;

                          if (supersetIndex !== newSupersetIndex)
                            setSupersetIndex(newSupersetIndex);

                          setSelectedExercise(e);
                        }}
                        sx={{
                          border: isSelected
                            ? `2px solid ${theme.palette.primary.main}`
                            : '1px solid transparent',
                          borderRadius: 2,
                          overflow: 'hidden',
                          width,
                          height,
                          flex: '0 0 auto',
                          position: 'relative',
                        }}
                      >
                        <Box
                          sx={{
                            filter: 'grayscale(100%)',
                            width: '100%',
                            height: '100%',
                          }}
                        >
                          {exercise.imageUrl || !exercise.videoUrl ? (
                            <Image
                              src={
                                exercise.imageUrl || EXERCISE_DEFAULT_IMG_URL
                              }
                              alt={exercise.name}
                              width={width}
                              height={height}
                              unoptimized={lib.common.env.unoptimizeImages()}
                              style={{ objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <Box
                              component="video"
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              src={exercise.videoUrl!}
                              muted
                              controls={false}
                              loop
                              playsInline
                            />
                          )}
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            display: progress > 0 ? undefined : 'none',
                            position: 'absolute',
                            bottom: 2,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '90%',
                            height: 5,
                            borderRadius: 5,
                            border: `1px solid ${theme.palette.primary.main}`,
                            bgcolor: 'rgba(0, 0, 0, 0.3)',
                            [`&.${linearProgressClasses.bar}`]: {
                              bgcolor: theme.palette.primary.main,
                            },
                            [`&.${linearProgressClasses.colorPrimary}`]: {
                              bgcolor: theme.palette.background.default,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {trainingInProgress && trainingInProgress.supersets ? (
        <TrainingInProgressExerciseContainer />
      ) : (
        <Box
          display="flex"
          width="100vw"
          height="100vh"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h6">No exercises</Typography>
          <Fab
            sx={{
              backgroundColor: theme.palette.primary.main,
              position: 'absolute',
              bottom: 60,
              left: 16,
            }}
            onClick={handleOpenMenu}
          >
            <MoreVertIcon />
          </Fab>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            PaperProps={{ sx: { mb: 1 } }}
          >
            <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
              <CloseIcon sx={{ marginRight: 1 }} />
              Cancel Training
            </MenuItem>
          </Menu>
        </Box>
      )}

      <CancelTrainingModal
        open={openCancelTrainingModal}
        setOpen={setOpenCancelTrainingModal}
      />

      <UndoneSetsErrorModal
        open={showUndoneSetsError}
        setOpen={setShowUndoneSetsError}
      />
    </Box>
  );
}
