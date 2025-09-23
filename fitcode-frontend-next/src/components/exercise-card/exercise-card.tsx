import { Box, Card, CardContent, CardMedia } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';

import type { Exercise } from '@/controller/exercise/type/exercise.type';

interface Props {
  exercise: Exercise;
}

export function ExerciseCard(props: Props) {
  const { exercise } = props;

  return (
    <Card
      sx={{
        borderRadius: 5,
      }}
    >
      <CardMedia
        component={
          exercise.videoUrl ? 'video' : exercise.imageUrl ? 'img' : 'div'
        }
        sx={{
          maxHeight: 140,
          background: 'background.dark',
          filter: 'grayscale(100%)',
        }}
        src={exercise.videoUrl || exercise.imageUrl}
        title={exercise.name}
        muted={exercise.videoUrl ? true : undefined}
        autoPlay={exercise.videoUrl ? true : undefined}
        loop={exercise.videoUrl ? true : undefined}
      />
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ p: 0.5, overflow: 'hidden' }} // parent can also hide overflow
      >
        <Typography
          noWrap
          fontSize={16}
          fontWeight={600}
          textAlign="center"
          textTransform="uppercase"
          sx={{
            flex: 1, // fill available space
            minWidth: 0, // <-- key for flex items so ellipsis can kick in
            px: 1,
          }}
        >
          {exercise.name}
        </Typography>
      </Box>
    </Card>
  );
}
