import { theme } from '@/app/style';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useCoachTrainingStation } from '@/store/coach-training-station.provider';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

export default function TrainingStationExercises() {
  const { station, selectedExercise, setSelectedExercise } =
    useCoachTrainingStation();

  const IMAGES_WIDTH = 140;

  return (
    <Box
      display="flex"
      sx={{ mx: 'auto', overflowX: 'auto', ...styledScrollbarSx(theme) }}
      gap={1}
    >
      {station?.exercises.map((exercise) => (
        <Box
          key={exercise.id}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.5}
          maxWidth={IMAGES_WIDTH}
          onClick={() => {
            setSelectedExercise(exercise);
          }}
          sx={{
            cursor: 'pointer',
          }}
        >
          <Image
            src={exercise.exercise?.imageUrl || EXERCISE_DEFAULT_IMG_URL}
            alt="Exercise Image"
            width={IMAGES_WIDTH}
            height={0}
            unoptimized={lib.common.env.unoptimizeImages()}
            layout="intrinsic"
            style={{
              borderRadius: 6,
              border:
                selectedExercise?.id === exercise.id
                  ? `2px solid ${theme.palette.primary.main}`
                  : '2px solid transparent',
            }}
          />
          <Typography
            fontSize={16}
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
