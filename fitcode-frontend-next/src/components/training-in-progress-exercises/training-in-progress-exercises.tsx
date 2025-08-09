import { CameraAlt } from '@mui/icons-material';
import { Box, Grid2, IconButton, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import MediapipePoseDetection from '../mediapipe-pose-detection/mediapipe-pose-detection';
import TrainingInProgressExerciseSet from '../training-in-progress-exercise-set/training-in-progress-exercise-set';
import type { SetState } from '@/common/type/state.type';
import type { Superset } from '@/controller/training/type/superset.type';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';

interface TrainingInProgressExercisesProps {
  selectedSuperset: Superset;
  setSelectedSuperset: SetState<Superset | undefined>;
}

export default function TrainingInProgressExercises(
  props: TrainingInProgressExercisesProps
) {
  const screenSize = useScreenSize();
  const [openPoseDetection, setOpenPoseDetection] = useState(false);

  const { exercises } = useMain();
  const { trainingInProgress } = useTraining();

  const { selectedSuperset, setSelectedSuperset } = props;

  if (!trainingInProgress) return null;

  if (openPoseDetection)
    return (
      <MediapipePoseDetection setOpenPoseDetection={setOpenPoseDetection} />
    );

  return selectedSuperset.exercises.map((exercise, i) => {
    exercise.exercise = exercises.find((ex) => ex.id === exercise.id);
    if (!exercise.exercise) return null;

    const isBilateral = exercise.exercise?.isBilateral || false;

    return (
      <Box
        key={`${exercise.id}${i}`}
        width="100%"
        display="flex"
        flexDirection="column"
        sx={{ position: 'relative' }}
      >
        <IconButton
          sx={{
            p: 0,
            m: 0,
            position: 'absolute',
            top: 0,
            right: 5,
            display: exercise.exercise?.name.includes('squat')
              ? 'none'
              : undefined,
          }}
          onClick={() => {
            setOpenPoseDetection(true);
          }}
        >
          <CameraAlt />
        </IconButton>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            textTransform: 'uppercase',
            fontWeight: 'bold',
          }}
        >
          {exercise.exercise?.name || 'Un-named Exercise'}
        </Typography>

        <Box
          position="absolute"
          display="flex"
          flexDirection="column"
          top={0}
          left={10}
          zIndex={1000}
          pb={
            screenSize.isMobile || screenSize.isLandscapeMobile ? 35 : undefined
          }
        >
          <Typography variant="body2" color="rgb(177, 183, 189)">
            {`${trainingInProgress.supersets.indexOf(selectedSuperset) + 1}${String.fromCharCode(65 + i)}`}
          </Typography>
        </Box>
        <Grid2
          container
          size={12}
          width="100%"
          mt={1}
          display="flex"
          alignItems="center"
        >
          <Grid2
            size={4.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 1 }}
          >
            <Image
              src={
                exercise.exercise?.imageUrl?.trim() ||
                '/fitcode_logo_transparent_square.png'
              }
              alt="Exercise Image"
              width={
                !screenSize.isMobile
                  ? exercise.exercise?.imageUrl
                    ? 200
                    : 100
                  : exercise.exercise?.imageUrl &&
                      exercise.exercise?.imageUrl.length > 2
                    ? 170
                    : 100
              }
              height={0}
              style={{
                maxWidth: !screenSize.isMobile ? '200px' : '170px',
                height: 'auto', // Maintains aspect ratio dynamically
                borderRadius: 15,
              }}
            />
          </Grid2>
          <Grid2 size={7.5} px={1}>
            <Box
              key={exercise.id}
              display="flex"
              flexDirection="column"
              width="100%"
              gap={1}
            >
              {exercise.sets.map((set, i) => {
                return (
                  <TrainingInProgressExerciseSet
                    key={`${exercise.id}-set-${i}`}
                    set={set}
                    exercise={exercise}
                    selectedSuperset={selectedSuperset}
                    setSelectedSuperset={setSelectedSuperset}
                    i={i}
                    isBilateral={isBilateral}
                  />
                );
              })}
            </Box>
          </Grid2>
        </Grid2>
      </Box>
    );
  });
}
