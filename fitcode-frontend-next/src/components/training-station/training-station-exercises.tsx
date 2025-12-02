import { theme } from '@/app/style';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useCoachTrainingStation } from '@/store/coach-training-station.provider';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useEffect } from 'react';

export default function TrainingStationExercises() {
  const {
    station,
    individualTrainings,
    component,
    selectedUser,
    selectedExercise,
    setSelectedExercise,
    setSelectedSetIndex,
  } = useCoachTrainingStation();

  const individualTraining = individualTrainings.find(
    (t) => t.userId === selectedUser?.uid
  );

  const individualExercises =
    individualTraining?.components
      .find((c) => c.id === component?.id)
      ?.supersets.flatMap((s) => s.exercises) || [];

  const userExercises = station?.exercises.filter((e) =>
    individualExercises.some((ie) => ie.id === e.id)
  );

  // Prevents selected exercise from being invalid when switching users
  useEffect(() => {
    if (!(userExercises || []).some((e) => e.id === selectedExercise?.id)) {
      setSelectedExercise((userExercises || [])[0] || null);
      setSelectedSetIndex(0);
    }
  }, [selectedUser, station]);

  if (!station) return null;

  if (!individualTraining) return null;

  const IMAGES_WIDTH = 100;
  const IMAGES_HEIGHT = IMAGES_WIDTH * 0.6;

  return (
    <Box
      maxWidth="100%"
      display="flex"
      sx={{ mx: 'auto', overflowX: 'auto', ...styledScrollbarSx(theme), px: 1 }}
      gap={1}
    >
      {(userExercises || []).map((exercise) => (
        <Box
          key={exercise.id}
          width={IMAGES_WIDTH}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.5}
          onClick={() => {
            setSelectedExercise(exercise);
            setSelectedSetIndex(0);
          }}
          sx={{
            cursor: 'pointer',
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            width={IMAGES_WIDTH}
            height={IMAGES_HEIGHT}
            sx={{
              borderRadius: 2,
              border:
                selectedExercise?.id === exercise.id
                  ? `2px solid ${theme.palette.primary.main}`
                  : '2px solid transparent',
              overflow: 'hidden',
              flex: '0 0 auto',
              position: 'relative',
            }}
          >
            <Image
              src={exercise.exercise?.imageUrl || EXERCISE_DEFAULT_IMG_URL}
              alt="Exercise Image"
              width={IMAGES_WIDTH}
              height={IMAGES_HEIGHT}
              unoptimized={lib.common.env.unoptimizeImages()}
              style={{
                filter: 'grayscale(100%)',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </Box>

          <Typography
            fontSize={12}
            fontWeight={500}
            textAlign="center"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {exercise.exercise?.name || 'Unknown Exercise'}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
