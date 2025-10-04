import { Circle } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Image from 'next/image';
import { useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

import AthleteTrainingExerciseSets from '../athlete-training-exercise-sets/athlete-training-exercise-sets';
import MobileMovementValidation from '../mobile-movement-validation/mobile-movement-validation';
import SwipeableBox from '../swipeable-box/swipeable-box';
import { updateExerciseAttributeValues } from '../training-exercise-card-sets-expanded/state';
import { markExerciseSetAsCompleted } from './state';
import TrainingExerciseSetDoneCheckbox from './training-exercise-set-done-checkbox';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import type { ParamType } from '@/controller/component/enum/param.enum';
import { IntType, VolType } from '@/controller/component/enum/param.enum';
import { EXERCISE_POSES } from '@/controller/pose-detection/const/exercise-poses';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import ImageGallery from './image-gallery';
import { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import TrainingInProgressTempoChart from './training-in-progress-exercise-charts';

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
  } = useTrainingInProgress();

  const { selectedTrackingMethod, setSelectedTrackingMethod } =
    useAthleteHeader();

  const isCircuit =
    trainingInProgress?.selectedComponent.mainSet === MainSet.CIRCUIT;

  const labelRef = useRef<string>('');

  const computedLabel = useMemo(() => {
    if (typeof exerciseIndex !== 'number' || typeof supersetIndex !== 'number')
      return labelRef.current;

    if (isCircuit) return String(exerciseIndex + 1);

    const letter = String.fromCharCode(65 + exerciseIndex);
    labelRef.current = `${supersetIndex + 1}${letter}`;
    return `${supersetIndex + 1}${letter}`;
  }, [exerciseIndex]);

  if (computedLabel) labelRef.current = computedLabel;

  if (!trainingInProgress || !selectedSuperset || !selectedExercise)
    return labelRef.current;

  const updateExerciseValues = (
    repsCount: number,
    tempo: number,
    passedExercise?: TrainingExerciseRecording
  ) => {
    if (supersetIndex === undefined) return;

    if (setIndex === undefined) return;

    const updatableExercise = passedExercise || selectedExercise;

    const selectedSet = updatableExercise.sets[setIndex];
    if (!selectedSet) return;

    let repParamField: ParamType | undefined;
    let tempoParamField: ParamType | undefined;

    const repParamFieldSet = selectedSet.paramValuesL.find(
      (p) => p.selected === VolType.Rep
    );
    if (repParamFieldSet) repParamField = repParamFieldSet.field as ParamType;

    const tempoParamFieldSet = selectedSet.paramValuesL.find(
      (p) => p.selected === IntType.Tempo
    );
    if (tempoParamFieldSet)
      tempoParamField = tempoParamFieldSet.field as ParamType;

    const repParam = updatableExercise.params.find(
      (p) => p.field === repParamField
    );

    if (repParam) {
      ['L'].concat(selectedSet.paramValuesR ? ['R'] : []).forEach((lOrR) => {
        updateExerciseAttributeValues(
          {
            newValue: repsCount.toString(),
            i: setIndex,
            set: selectedSet,
            lOrR: lOrR as 'L' | 'R',
          },
          {
            selectedExercises: [updatableExercise],
            exercise: updatableExercise,
            param: repParam,
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
    }

    const tempoParam = updatableExercise.params.find(
      (p) => p.field === tempoParamField
    );

    if (tempoParam) {
      ['L'].concat(selectedSet.paramValuesR ? ['R'] : []).forEach((lOrR) => {
        updateExerciseAttributeValues(
          {
            newValue: tempo.toString(),
            i: setIndex,
            set: selectedSet,
            lOrR: lOrR as 'L' | 'R',
          },
          {
            selectedExercises: [updatableExercise],
            exercise: updatableExercise,
            param: tempoParam,
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
    }

    // markExerciseSetAsCompleted(
    //   { exerciseId: updatableExercise.id },
    //   setIndex + 1,
    //   trainingInProgress.exerciseSetTrackingState,
    //   setTrainingInProgress
    // );

    updateTrainingInProgress(updatableExercise, supersetIndex);
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

  return selectedTrackingMethod === TrackingMethod.CAMERA ? (
    <MobileMovementValidation
      selectedExercise={selectedExercise}
      setSelectedExercise={setSelectedExercise}
      selectedTrackingMethod={selectedTrackingMethod}
      setSelectedTrackingMethod={setSelectedTrackingMethod}
      updateExerciseValues={updateExerciseValues}
      trainingId={trainingInProgress.training.id}
      componentId={trainingInProgress.selectedComponent.id}
      supersetIndex={supersetIndex!}
      setIndex={setIndex!}
    />
  ) : (
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
        sx={{
          backgroundColor: theme.palette.background.default,
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
            py: 1.5,
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
              backgroundColor: theme.palette.background.default,
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
            <Box
              display="flex"
              flexDirection="column"
              sx={{ cursor: 'pointer' }}
            >
              <Typography
                variant="caption"
                color={theme.palette.primary.main}
                sx={{ zIndex: 1 }}
              >
                {labelRef.current}
              </Typography>
            </Box>
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
                display="flex"
                alignItems="center"
                fontWeight={600} // use numeric instead of "semi-bold"
                fontSize={20}
                lineHeight={1} // <-- add this
                textTransform="uppercase"
                color={theme.palette.primary.main}
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
            </Box>
          </Stack>
        </Stack>

        {/* Image */}
        <Box position="relative">
          {selectedExercise.exercise?.videoUrl ? (
            <video
              muted
              playsInline
              controls
              poster={selectedExercise.exercise?.imageUrl || undefined}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                filter: 'grayscale(100%)',
              }}
              preload="metadata"
              src={selectedExercise.exercise.videoUrl}
            />
          ) : (
            <Image
              src={
                selectedExercise.exercise?.imageUrl ||
                '/exercise-image-default.png'
              }
              alt={selectedExercise.exercise?.name || ''}
              width={0}
              height={0}
              sizes={'100vw'}
              style={{
                maxWidth: '1200px',
                width: '100vw',
                height: 'auto',
              }}
            />
          )}
          <Box
            display="flex"
            flexDirection="column"
            sx={{
              position: 'absolute',
              top: 5,
              left: 0,
              transform: 'translate(50%, 0)',
            }}
            gap={2}
          >
            {Array.from({ length: selectedSuperset.exercises.length }).map(
              (_, index) => {
                if (exerciseIndex === undefined) return null;
                const letter = String.fromCharCode(65 + index);

                const isSelected =
                  exerciseIndex !== undefined && exerciseIndex === index;

                return (
                  <Typography
                    key={index}
                    display="flex"
                    alignItems="center"
                    fontWeight={600}
                    color={isSelected ? theme.palette.primary.main : undefined}
                    lineHeight={1}
                    gap={0.5}
                    onClick={() => {
                      const exerciseToSelect =
                        selectedSuperset.exercises[index];
                      if (exerciseToSelect)
                        setSelectedExercise(exerciseToSelect);
                    }}
                    sx={{
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                      pr: 1.5,
                    }}
                  >
                    {letter}
                    {isSelected && (
                      <Circle
                        sx={{
                          color: theme.palette.primary.main,
                          fontSize: 10,
                        }}
                      />
                    )}
                  </Typography>
                );
              }
            )}
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
            borderTop: `2px solid ${theme.palette.primary.main}`,
            position: 'relative',
            py: 2,
          }}
          gap={0.5}
        >
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="space-evenly"
          >
            {selectedExercise.sets.map((s, i) => (
              <Typography
                key={i}
                fontSize={12}
                textAlign="center"
                fontWeight="bold"
                sx={{
                  position: 'relative',
                  px: 1.5,
                  py: 0.5,
                  cursor: 'pointer',
                  borderRadius: '7px',
                  color:
                    setIndex === i ? theme.palette.text.secondary : undefined,
                  backgroundColor:
                    setIndex === i ? theme.palette.primary.main : undefined,
                  textTransform: 'uppercase',
                }}
                onClick={() => {
                  setSetIndex(i);
                }}
              >
                Set {i + 1}
              </Typography>
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
                  px: 1.2,
                  py: 2,
                  pb: 0,
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

          <Box
            width="100%"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              px: 2,
            }}
          >
            <Box width="20%">
              <Box
                width={22}
                height={22}
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '25%',
                }}
                onClick={() => {
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

                  setSelectedTrackingMethod(TrackingMethod.CAMERA);
                }}
              >
                <Box
                  width={6}
                  height={6}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    borderRadius: '50%',
                  }}
                />
              </Box>
            </Box>
            <Box width="60%">
              <Typography
                fontSize={20}
                fontWeight="bold"
                lineHeight={1}
                textAlign="center"
                maxWidth={300}
                sx={{
                  mx: 'auto',
                  py: 1,
                  px: 2,
                  textTransform: 'uppercase',
                  color: theme.palette.primary.main,
                  borderTop: `1px solid ${theme.palette.background.divider}`,
                  borderBottom: `1px solid ${theme.palette.background.divider}`,
                }}
              >
                Do it right
              </Typography>
            </Box>
            <Box width="20%">
              <Box
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                gap={0.25}
              >
                <Typography fontSize={12}>Done</Typography>
                <TrainingExerciseSetDoneCheckbox
                  exercise={selectedExercise}
                  setIndex={setIndex!}
                  exerciseView
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          {setIndex !== undefined && (
            <TrainingInProgressTempoChart
              selectedExercise={selectedExercise}
              setIndex={setIndex}
              width={Math.min(window.innerWidth * 0.95, 620)} // max 620px
            />
          )}
          <ImageGallery
            images={
              (selectedExercise.recordedSets || []).find(
                (set) => set.setIndex === setIndex
              )?.images || []
            }
          />
        </Box>
      </Box>
    </SwipeableBox>
  );
}
