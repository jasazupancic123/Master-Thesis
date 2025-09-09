import {
  ArrowDropDown,
  ArrowDropUp,
  ArrowLeft,
  ArrowRight,
  CameraAltOutlined,
  KeyboardOutlined,
} from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import TrapezoidTitle from '../athlete-options-container/trapezoid-title';
import AthleteTrainingExerciseSets from '../athlete-training-exercise-sets/athlete-training-exercise-sets';
import SwipeableBox from '../swipeable-box/swipeable-box';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgressExerciseCard() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { trainingInProgress } = useTraining();

  const {
    selectedExercise,
    setSelectedExercise,
    selectedSuperset,
    exerciseIndex,
    supersetIndex,
    setIndex,
    setSetIndex,
  } = useTrainingInProgress();

  const [expandedSetsView, setExpandedSetsView] = useState(false);
  const [selectedTrackingMethod, setSelectedTrackingMethod] =
    useState<TrackingMethod>(TrackingMethod.MANUAL);

  if (!trainingInProgress || !selectedSuperset || !selectedExercise)
    return null;

  const isCircuit =
    trainingInProgress.selectedComponent.mainSet === MainSet.CIRCUIT;

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

  return (
    <SwipeableBox
      onSwipeLeft={goToNextExercise}
      onSwipeRight={goToPreviousExercise}
    >
      <Box
        width="100%"
        minHeight="80vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Stack
          p={1}
          px={screenSize.isMobile ? 0 : undefined}
          pb={2}
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
          {exerciseIndex !== undefined &&
            exerciseIndex !== null &&
            supersetIndex !== undefined &&
            supersetIndex !== null && (
              <Box
                position="absolute"
                top={7.4}
                left={10}
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

          <Stack direction="row" justifyContent="center" sx={{ mt: 0 }}>
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
          </Stack>

          <Box
            width="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              position: 'relative',
              px: 2,
            }}
          >
            {selectedSuperset.exercises.indexOf(selectedExercise) > 0 && (
              <IconButton
                onClick={goToPreviousExercise}
                sx={{
                  p: 0,
                  m: 0,
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <ArrowLeft />
              </IconButton>
            )}
            <AthleteTrainingExerciseSets
              training={trainingInProgress?.training}
              exercise={selectedExercise}
              borderBottomRadius={false}
              expanded={expandedSetsView}
              trainingInProgressView
            />
            {selectedSuperset.exercises.indexOf(selectedExercise) <
              selectedSuperset.exercises.length - 1 && (
              <IconButton
                onClick={goToNextExercise}
                sx={{
                  p: 0,
                  m: 0,
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <ArrowRight />
              </IconButton>
            )}
          </Box>

          <IconButton
            onClick={() => setExpandedSetsView(!expandedSetsView)}
            sx={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {expandedSetsView ? <ArrowDropUp /> : <ArrowDropDown />}
          </IconButton>
        </Stack>

        {/* Image */}
        {selectedExercise.exercise?.imageUrl && (
          <Image
            src={selectedExercise.exercise.imageUrl}
            alt={selectedExercise.exercise?.name || ''}
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
          />
        )}

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
            justifyContent="flex-end"
            pt={0.5}
            pr={2}
            gap={2}
          >
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
                onClick={() => setSelectedTrackingMethod(method)}
              >
                {method === TrackingMethod.MANUAL ? (
                  <KeyboardOutlined />
                ) : (
                  <CameraAltOutlined />
                )}
              </IconButton>
            ))}
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
                {setIndex > 0 && (
                  <IconButton
                    onClick={goToPreviousSet}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      p: 0,
                      m: 0,
                    }}
                  >
                    <ArrowLeft />
                  </IconButton>
                )}

                {setIndex < selectedExercise.sets.length - 1 && (
                  <IconButton
                    onClick={goToNextSet}
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      p: 0,
                      m: 0,
                    }}
                  >
                    <ArrowRight />
                  </IconButton>
                )}
                <AthleteTrainingExerciseSets
                  training={trainingInProgress?.training}
                  exercise={selectedExercise}
                  borderBottomRadius={false}
                  expanded={false}
                  trainingInProgressView
                  passedSet={selectedExercise.sets[setIndex]}
                  supersetIndex={supersetIndex}
                  setIndex={setIndex}
                />
              </Box>
            )}
        </Box>
      </Box>
    </SwipeableBox>
  );
}
