import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Image from 'next/image';
import toast from 'react-hot-toast';

import AthleteTrainingExerciseSets from '../athlete/athlete-training-exercise-sets';
import TrainingExerciseSetDoneCheckbox from './training-exercise-set-done-checkbox';
import RomChart from '@/components/charts/rom/rom-chart';
import RomStatistic from '@/components/charts/rom/rom-statistics';
import TempoChart from '@/components/charts/tempo/tempo-chart';
import TempoStatistic from '@/components/charts/tempo/tempo-statistic';
import MobileMovementValidation from '@/components/mobile-movement-validation/mobile-movement-validation';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { EXERCISE_POSES } from '@/lib/pose-detection/const/exercise-poses';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import ImageGallery from '@/ui/image-gallery';

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
        pb: '100px',
        mt: 2,
      }}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          backgroundColor: theme.palette.background.default,
          py: 1.5,
        }}
      >
        <Typography
          display="flex"
          alignItems="center"
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
      </Box>

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
            }}
          />
        )}
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
          py: 2,
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
                state.completedSetNumbers.includes(s.setNumber)
            );

            return (
              <Box
                key={i}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                gap={0.5}
                alignItems="center"
              >
                <Typography
                  fontSize={12}
                  textAlign="center"
                  fontWeight="bold"
                  sx={{
                    position: 'relative',
                    px: 3,
                    py: 0.5,
                    lineHeight: 1,
                    cursor: 'pointer',
                    color: isSetDone ? theme.palette.text.secondary : undefined,
                    backgroundColor: isSetDone
                      ? theme.palette.primary.main
                      : undefined,
                    border: `1px solid ${theme.palette.primary.main}`,
                    borderLeft: i === 0 ? undefined : 'none',
                    borderRight:
                      i === selectedExercise.sets.length - 1
                        ? undefined
                        : 'none',
                    borderTopLeftRadius: i === 0 ? '8px' : undefined,
                    borderBottomLeftRadius: i === 0 ? '8px' : undefined,
                    borderTopRightRadius:
                      i === selectedExercise.sets.length - 1
                        ? '8px'
                        : undefined,
                    borderBottomRightRadius:
                      i === selectedExercise.sets.length - 1
                        ? '8px'
                        : undefined,
                    textTransform: 'uppercase',
                  }}
                  onClick={() => {
                    setSetIndex(i);
                  }}
                >
                  Set {i + 1}
                </Typography>
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
                {/* <Circle
                  sx={{
                    fontSize: 8,
                    verticalAlign: 'middle',
                    color:
                      setIndex === i
                        ? theme.palette.primary.main
                        : 'transparent',
                    mr: 0.5,
                    mb: 0.2,
                  }}
                /> */}
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
                if (!selectedExercise.exercise || setIndex === undefined)
                  return;

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

                const setTrackingState =
                  trainingInProgress.exerciseSetTrackingState.find(
                    (state) => state.exerciseId === selectedExercise.id
                  );

                if (!setTrackingState) return;

                const isCurrentSetDone =
                  setTrackingState.completedSetNumbers.includes(setIndex + 1);

                if (isCurrentSetDone) {
                  toast.error('This set is already marked as done');
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
          <>
            <TempoChart
              selectedExercise={selectedExercise}
              setIndex={setIndex}
              width={Math.min(window.innerWidth * 0.95, 620)} // max 620px
              isUnilateral={selectedExercise.exercise?.isUnilateral || false}
            />
            <TempoStatistic
              selectedExercise={selectedExercise}
              setIndex={setIndex}
            />
            <RomChart
              selectedExercise={selectedExercise}
              setIndex={setIndex}
              width={Math.min(window.innerWidth * 0.95, 620)} // max 620px
            />
            <RomStatistic
              selectedExercise={selectedExercise}
              setIndex={setIndex}
            />
          </>
        )}

        <ImageGallery
          imagesL={
            (selectedExercise.recordedSets || []).find(
              (set) => set.setIndex === setIndex
            )?.imagesL || []
          }
          imagesR={
            (selectedExercise.recordedSets || []).find(
              (set) => set.setIndex === setIndex
            )?.imagesR || []
          }
          enableImagePickerSlider
        />
      </Box>
    </Box>
  );
}
