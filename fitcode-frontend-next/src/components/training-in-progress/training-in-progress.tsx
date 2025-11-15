import { Circle } from '@mui/icons-material';
import { Box, LinearProgress, Typography } from '@mui/material';
import { linearProgressClasses } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import Image from 'next/image';
import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import AthleteHeader from '../athlete/athlete-header';
import { handleInitTrainingInProgressComponent } from './actions/actions-training-in-progress';
import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import { useUndoneExercises } from './context/undone-exercises.provider';
import FinishPauseTrainingModal from './modals/finish-pause-training-modal';
import UndoneSetsErrorModal from './modals/undone-sets-error-modal';
import TrainingInProgressExerciseContainer from './training-in-progress-exercise-container';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { preloadPoseLandmarker } from '@/lib/pose-detection/util/pose-landmarker-loader.util';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { usePathname } from 'next/navigation';

export default function TrainingInProgress() {
  const theme = useTheme();
  const pathname = usePathname();

  const { user } = useAuthenticatedAuth();
  const { activeTraining } = useMain();
  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();
  const trainingInProgressUtilsContext = useTrainingInProgressUtils();
  const athleteHeaderContext = useAthleteHeader();
  const undoneExercisesContext = useUndoneExercises();

  const { trainingInProgress, clearTrainingState } = trainingContext;

  const {
    supersetIndex,
    setSupersetIndex,
    selectedExercise,
    setSelectedExercise,
  } = trainingInProgressContext;

  const {
    openCancelTrainingModal,
    setOpenCancelTrainingModal,
    openFinishTrainingModal,
    setOpenFinishTrainingModal,
    showUndoneSetsError,
    setShowUndoneSetsError,
  } = trainingInProgressUtilsContext;

  const { selectedTrackingMethod } = athleteHeaderContext;

  const exerciseRefs = useRef(new Map<string, HTMLDivElement>());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastScrollLeft = useRef<number>(0);

  const getExerciseRef = useCallback(
    (id: string): React.RefCallback<HTMLDivElement> =>
      (node) => {
        if (node) exerciseRefs.current.set(id, node);
        else exerciseRefs.current.delete(id);
      },
    []
  );

  useEffect(() => {
    const redirectToTrainings = async () => {
      window.location.href = '/trainings';
      await clearTrainingState();
    };

    if (!activeTraining || !activeTraining.statuses?.length) {
      redirectToTrainings();
      return;
    }

    const componentId = pathname.split('/').pop() || '';

    if (activeTraining && activeTraining.statuses && componentId) {
      const status = activeTraining.statuses.find(
        (s) =>
          s.componentId === componentId &&
          (s.status === TrainingStatus.IN_PROGRESS ||
            s.status === TrainingStatus.PAUSED)
      );

      if (!status) {
        redirectToTrainings();
        return;
      }

      const component = activeTraining.components.find(
        (c) => c.id === componentId
      );

      if (!component) {
        redirectToTrainings();
        return;
      }

      const trainingInProgress: TrainingInProgress = {
        userId: user.uid,
        training: activeTraining,
        recordedSets: [],
        startOfTraining: dayjs(),
        supersets: [],
        selectedComponent: component,
      };

      handleInitTrainingInProgressComponent({
        useTraining: { ...trainingContext, trainingInProgress },
        useTrainingInProgressContext: trainingInProgressContext,
      });
    }
  }, [activeTraining]);

  /* Preload pose landmarker */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    preloadPoseLandmarker();
  }, []);

  /* Init training in progress for selected component */
  /* useEffect(() => {
    if (!trainingInProgress) return;

    handleInitTrainingInProgressComponent({
      useTraining: { ...trainingContext, trainingInProgress },
      useTrainingInProgressContext: trainingInProgressContext,
    });
  }, [trainingInProgress?.selectedComponent]); */

  // keep scroll position in case the whole list remounts
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => (lastScrollLeft.current = scroller.scrollLeft);
    scroller.addEventListener('scroll', onScroll);
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const scroller = scrollerRef.current;
    if (!scroller || !selectedExercise?.id) return;

    const el = exerciseRefs.current.get(selectedExercise.id);
    if (!el) {
      // If we don't have the element yet, at least restore previous scroll
      scroller.scrollLeft = lastScrollLeft.current;
      return;
    }

    // Center the selected exercise in the horizontal scroller
    const elCenter = el.offsetLeft + el.offsetWidth / 2;
    const target = elCenter - scroller.clientWidth / 2;

    const next = Math.max(0, target);
    scroller.scrollTo({ left: next, behavior: 'smooth' });
    lastScrollLeft.current = next;
  }, [selectedExercise, trainingInProgress, supersetIndex]);

  if (!trainingInProgress || !trainingInProgress.training) return null;

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
            component={'div'}
            ref={scrollerRef}
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
                      textTransform: isSelected ? 'uppercase' : undefined,
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

                      if (
                        !exercise ||
                        supersetIndex === undefined ||
                        !activeTraining
                      )
                        return null;

                      const width = 75;
                      const height = 50;

                      const completedSets =
                        ExerciseSetService.getCompletedExerciseSetsCount(
                          {
                            trainingId: trainingInProgress.training.id,
                            componentId:
                              trainingInProgress.selectedComponent.id,
                            exerciseId: e.id,
                            supersetIndex: i,
                          },
                          activeTraining.workloads
                        );

                      const progress = (completedSets / e.sets.length) * 100;

                      return (
                        <Box
                          component="div"
                          key={e.id}
                          ref={getExerciseRef(e.id)}
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
                            scrollBehavior: 'smooth',
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
      {trainingInProgress &&
      trainingInProgress.supersets &&
      trainingInProgress.supersets.length ? (
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
        </Box>
      )}
      <FinishPauseTrainingModal
        open={openCancelTrainingModal}
        setOpen={setOpenCancelTrainingModal}
        finish={false}
      />
      <FinishPauseTrainingModal
        open={openFinishTrainingModal}
        setOpen={setOpenFinishTrainingModal}
        finish={true}
      />
      <UndoneSetsErrorModal
        open={showUndoneSetsError}
        setOpen={setShowUndoneSetsError}
      />
    </Box>
  );
}
