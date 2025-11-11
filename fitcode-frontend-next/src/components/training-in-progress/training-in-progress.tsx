import { Circle } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Fab,
  LinearProgress,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { linearProgressClasses } from '@mui/material';
import { useTheme } from '@mui/material';
import Image from 'next/image';
import React, { useEffect } from 'react';

import AthleteHeader from '../athlete/athlete-header';
import { handleInitTrainingInProgressComponent } from './actions/actions-training-in-progress';
import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import { useUndoneExercises } from './context/undone-exercises.provider';
import CancelTrainingModal from './modals/cancel-training-modal';
import UndoneSetsErrorModal from './modals/undone-sets-error-modal';
import TrainingInProgressExerciseContainer from './training-in-progress-exercise-container';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { TrainingService } from '@/core/training/training.service';
import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { preloadPoseLandmarker } from '@/lib/pose-detection/util/pose-landmarker-loader.util';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgress() {
  const theme = useTheme();

  const { user } = useAuthenticatedAuth();
  const { activeTraining, exercises } = useMain();
  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();
  const trainingInProgressUtilsContext = useTrainingInProgressUtils();
  const athleteHeaderContext = useAthleteHeader();
  const undoneExercisesContext = useUndoneExercises();

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

  useEffect(() => {
    if (!activeTraining.training || !activeTraining.report) return;

    TrainingService.mapData(activeTraining.training, { exercises });

    const componentId = activeTraining.report.componentStatuses.find(
      (cs) => cs.status === TrainingStatus.IN_PROGRESS
    )?.componentId;

    if (!componentId) return;

    const component = activeTraining.training.components.find(
      (c) => c.id === componentId
    );

    if (!component) return;

    const state: ExerciseSetTracking[] =
      component.supersets
        .map((s, sIndex) => {
          return s.exercises.map((e) => {
            return {
              exerciseId: e.id,
              supersetIndex: sIndex,
              completedSetNumbers: [] as {
                setNumber: number;
                timestamp: Date;
              }[],
            };
          });
        })
        .flat() || [];

    trainingContext.setTrainingInProgress({
      training: activeTraining.training as Training,
      selectedComponent: component,
      userId: user.uid,
      exerciseSetTrackingState: state,
    } as TrainingInProgress);
  }, []);

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
        <>
          <AthleteHeader
            trainingInProgressUndoneExercisesContext={undoneExercisesContext}
            trainingInProgressContext={trainingInProgressContext}
            trainingInProgressUtilsContext={trainingInProgressUtilsContext}
          />
          <Box
            display="flex"
            gap={1}
            px={1}
            pb={1}
            mt={2}
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
                  gap={0.5}
                >
                  <Typography
                    key={i}
                    fontSize={14}
                    fontWeight={isSelected ? 600 : undefined}
                    textAlign="center"
                    noWrap
                    sx={{
                      flex: '0 0 auto',
                      color: isSelected
                        ? theme.palette.primary.main
                        : undefined,
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
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                controls={false}
                                src={exercise.videoUrl!}
                                muted
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
        </>
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
