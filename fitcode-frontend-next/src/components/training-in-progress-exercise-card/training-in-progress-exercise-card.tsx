import {
  ArrowDropDown,
  ArrowDropUp,
  CameraAltOutlined,
  CheckCircle,
  KeyboardOutlined,
  PanoramaFishEye,
} from '@mui/icons-material';
import { Box, Checkbox, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';

import TrapezoidTitle from '../athlete-options-container/trapezoid-title';
import AthleteTrainingExerciseSets from '../athlete-training-exercise-sets/athlete-training-exercise-sets';
import MobileMovementValidation from '../mobile-movement-validation/mobile-movement-validation';
import SwipeableBox from '../swipeable-box/swipeable-box';
import { updateExerciseAttributeValues } from '../training-exercise-card-sets-expanded/state';
import {
  isExerciseSetCompleted,
  markExerciseSetAsCompleted,
  unmarkExerciseSetAsCompleted,
} from './state';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { ParamType } from '@/controller/component/enum/param.enum';
import { EXERCISE_POSES } from '@/controller/pose-detection/const/exercise-poses';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { TrainingService } from '@/controller/training/training.service';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgressExerciseCard() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    trainingInProgress,
    setTrainingInProgress,
    updateTrainingInProgress,
  } = useTraining();

  const {
    selectedExercise,
    setSelectedExercise,
    selectedSuperset,
    exerciseIndex,
    supersetIndex,
    setIndex,
    setSetIndex,
    handleUpsertSet,
  } = useTrainingInProgress();

  const { selectedTrackingMethod, setSelectedTrackingMethod } =
    useAthleteHeader();

  const [expandedSetsView, setExpandedSetsView] = useState(false);
  const [imageHeight, setImageHeight] = useState(0);

  if (!trainingInProgress || !selectedSuperset || !selectedExercise)
    return null;

  const isCircuit =
    trainingInProgress.selectedComponent.mainSet === MainSet.CIRCUIT;

  const updateExerciseReps = (repsCount: number) => {
    if (supersetIndex === undefined) return;

    if (setIndex === undefined) return;

    const selectedSet = selectedExercise.sets[setIndex];
    if (!selectedSet) return;

    const param = selectedExercise.params.find(
      (p) => p.field === ParamType.VolWork1
    );

    if (!param) return;

    ['L'].concat(selectedSet.paramValuesR ? ['R'] : []).forEach((lOrR) => {
      updateExerciseAttributeValues(
        {
          newValue: repsCount.toString(),
          i: setIndex,
          set: selectedSet,
          lOrR: lOrR as 'L' | 'R',
        },
        {
          selectedExercises: [selectedExercise],
          exercise: selectedExercise,
          param,
          training: trainingInProgress.training,
          component: trainingInProgress.selectedComponent,
          setTraining: () => {},
          supersets: trainingInProgress.supersets,
          setDetectedChanges: () => {},
          selectedSubgroup: null,
          setSelectedSubgroup: () => {},
        }
      );
    });

    markExerciseSetAsCompleted(
      { exerciseId: selectedExercise.id, supersetIndex },
      setIndex + 1,
      trainingInProgress.exerciseSetTrackingState,
      setTrainingInProgress
    );

    updateTrainingInProgress(selectedExercise, supersetIndex);
  };

  const goToNextExercise = () => {
    const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
    const nextExercise = selectedSuperset.exercises[currentIndex + 1];
    if (nextExercise) {
      setSelectedExercise(nextExercise);
      setSetIndex(0);
    }
  };

  const goToPreviousExercise = () => {
    const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
    const previousExercise = selectedSuperset.exercises[currentIndex - 1];
    if (previousExercise) {
      setSelectedExercise(previousExercise);
      setSetIndex(0);
    }
  };

  const goToNextSet = () => {
    if (setIndex === undefined || setIndex === null) return;
    if (setIndex < selectedExercise.sets.length - 1) setSetIndex(setIndex + 1);
  };

  const goToPreviousSet = () => {
    if (setIndex === undefined || setIndex === null) return;
    if (setIndex > 0) setSetIndex(setIndex - 1);
  };

  return selectedTrackingMethod === TrackingMethod.CAMERA ? (
    <MobileMovementValidation
      selectedExercise={selectedExercise}
      selectedTrackingMethod={selectedTrackingMethod}
      setSelectedTrackingMethod={setSelectedTrackingMethod}
      updateExerciseReps={updateExerciseReps}
    />
  ) : (
    <SwipeableBox
      onSwipeLeft={expandedSetsView ? undefined : goToNextExercise}
      onSwipeRight={expandedSetsView ? undefined : goToPreviousExercise}
      onSwipeUp={expandedSetsView ? undefined : goToNextSet}
      onSwipeDown={expandedSetsView ? undefined : goToPreviousSet}
    >
      <Box
        width="100%"
        minHeight="80vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          overflowY: expandedSetsView ? 'auto' : undefined,
          backgroundColor: theme.palette.background.dark,
          pb: '100px',
        }}
      >
        <Stack
          p={1}
          px={screenSize.isMobile ? 0 : undefined}
          gap={1}
          sx={{
            width: '100% !important',
            position: 'relative',
            backgroundPosition: 'center',
            backgroundSize: '100% auto',
            backgroundRepeat: 'no-repeat',
            overflow: 'hidden',
          }}
        >
          {/* Background Overlay */}
          <Box
            sx={{
              width: '100% !important',
              cursor: 'pointer',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.palette.background.dark,
              zIndex: 0,
            }}
          />

          {/* Exercise Index */}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              mt: 0,
              position: 'relative',
              px: 2,
            }}
          >
            {exerciseIndex !== undefined &&
              exerciseIndex !== null &&
              supersetIndex !== undefined &&
              supersetIndex !== null && (
                <Box
                  display="flex"
                  flexDirection="column"
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography
                    variant="caption"
                    color={theme.palette.background.lightBorder}
                    sx={{ zIndex: 1 }}
                  >
                    {isCircuit
                      ? `${exerciseIndex + 1}`
                      : `${supersetIndex + 1}${String.fromCharCode(65 + exerciseIndex).replace('@', '')}`}
                  </Typography>
                </Box>
              )}
            <Box
              width="90%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <Typography
                variant="body1"
                fontWeight={700}
                fontSize={12}
                textTransform="uppercase"
                color={theme.palette.text.primary}
                sx={{
                  textAlign: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  maxWidth: '75%',
                  zIndex: 1,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                {selectedExercise.exercise?.name || 'Unnamed Exercise'}
              </Typography>
              <IconButton
                onClick={() => setExpandedSetsView(!expandedSetsView)}
                sx={{
                  p: 0,
                  m: 0,
                  mb: 0.25,
                }}
              >
                {expandedSetsView ? <ArrowDropUp /> : <ArrowDropDown />}
              </IconButton>
            </Box>
            {setIndex !== undefined && (
              <Box
                display="flex"
                flexDirection="column"
                sx={{ cursor: 'pointer' }}
              >
                <Typography
                  variant="caption"
                  color={theme.palette.background.lightBorder}
                  sx={{ zIndex: 1 }}
                >
                  Set {setIndex + 1}
                </Typography>
              </Box>
            )}
          </Stack>
        </Stack>

        {expandedSetsView && (
          <Box
            width="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={imageHeight ? imageHeight : undefined}
            sx={{
              position: 'relative',
              px: 2,
            }}
          >
            <AthleteTrainingExerciseSets
              training={trainingInProgress?.training}
              exercise={selectedExercise}
              borderBottomRadius={false}
              expanded={expandedSetsView}
              trainingInProgressView
              supersetIndex={supersetIndex}
              exerciseSetTrackingState={
                trainingInProgress.exerciseSetTrackingState
              }
              dissableBottomPadding
            />
          </Box>
        )}

        {/* Image */}
        {!expandedSetsView &&
          (selectedExercise.exercise?.videoUrl ? (
            <video
              muted
              playsInline
              controls
              poster={selectedExercise.exercise?.imageUrl || undefined}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              preload="metadata"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                const renderedHeight =
                  v.getBoundingClientRect().height || v.videoHeight;
                setImageHeight(renderedHeight);
              }}
              src={selectedExercise.exercise.videoUrl}
            />
          ) : (
            selectedExercise.exercise?.imageUrl && (
              <Image
                src={selectedExercise.exercise.imageUrl}
                alt={selectedExercise.exercise?.name || ''}
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: '100%', height: 'auto' }}
                onLoadingComplete={(img) => {
                  const { height } = img;
                  setImageHeight(height);
                }}
              />
            )
          ))}

        {/* Current tracking exercise set */}
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{
            backgroundColor: theme.palette.background.dark,
            borderTop: `3px solid ${theme.palette.background.textBackground}`,
            position: 'relative',
          }}
          gap={0.5}
        >
          <TrapezoidTitle title="Tracking" />

          <Box
            width="100%"
            display="flex"
            justifyContent="space-between"
            pt={0.5}
            px={2}
            gap={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {[TrackingMethod.MANUAL, TrackingMethod.CAMERA].map((method) => (
                <IconButton
                  key={method}
                  sx={{
                    p: 0,
                    m: 0,
                  }}
                  color={
                    selectedTrackingMethod === method ? 'primary' : 'default'
                  }
                  onClick={() => {
                    if (method === TrackingMethod.CAMERA) {
                      if (!selectedExercise.exercise) return;

                      const hasPoseLogic =
                        selectedExercise.exercise !== undefined &&
                        EXERCISE_POSES.some((ep) =>
                          ep.exerciseIds.includes(selectedExercise.exercise!.id)
                        );

                      if (!hasPoseLogic) {
                        toast.error(
                          'Pose detection is not supported for this exercise yet'
                        );
                        return;
                      }
                    }
                    setSelectedTrackingMethod(method);
                  }}
                >
                  {method === TrackingMethod.MANUAL ? (
                    <KeyboardOutlined />
                  ) : (
                    <CameraAltOutlined />
                  )}
                </IconButton>
              ))}
            </Box>
            <Box display="flex" alignItems="center" gap={0.25}>
              <Typography fontSize={12}>Done</Typography>

              <Checkbox
                icon={<PanoramaFishEye />}
                checkedIcon={
                  <CheckCircle sx={{ color: theme.palette.primary.main }} />
                }
                size="small"
                checked={
                  supersetIndex !== undefined &&
                  setIndex !== undefined &&
                  isExerciseSetCompleted(
                    { exerciseId: selectedExercise.id, supersetIndex },
                    setIndex + 1,
                    trainingInProgress.exerciseSetTrackingState
                  )
                }
                sx={{ '&.MuiCheckbox-root': { px: 0 } }}
                onChange={async (e) => {
                  if (supersetIndex === undefined || setIndex === undefined)
                    return;

                  const isCompleted = e.target.checked;
                  if (isCompleted) {
                    const set = TrainingService.exerciseSetToCompleteSet(
                      selectedExercise.sets[setIndex]
                    );

                    markExerciseSetAsCompleted(
                      { exerciseId: selectedExercise.id, supersetIndex },
                      setIndex + 1,
                      trainingInProgress.exerciseSetTrackingState,
                      setTrainingInProgress
                    );

                    await handleUpsertSet(set);
                  } else {
                    unmarkExerciseSetAsCompleted(
                      { exerciseId: selectedExercise.id, supersetIndex },
                      setIndex + 1,
                      trainingInProgress.exerciseSetTrackingState,
                      setTrainingInProgress
                    );
                  }
                }}
              />
            </Box>
          </Box>
          {setIndex !== undefined &&
            setIndex !== null &&
            selectedExercise.sets[setIndex] && (
              <Box
                width="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                  px: 2,
                  position: 'relative',
                }}
              >
                <AthleteTrainingExerciseSets
                  training={trainingInProgress?.training}
                  exercise={selectedExercise}
                  borderBottomRadius={false}
                  expanded={false}
                  trainingInProgressView
                  passedSet={selectedExercise.sets[setIndex]}
                  supersetIndex={supersetIndex}
                  setIndex={setIndex}
                  colorSetsToPrimary
                />
              </Box>
            )}
        </Box>
      </Box>
    </SwipeableBox>
  );
}
