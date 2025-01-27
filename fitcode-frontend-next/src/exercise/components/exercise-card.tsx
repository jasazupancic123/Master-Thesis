import type { Exercise } from '@/exercise/entity/exercise.entity';
import { Card, CardContent, CardMedia } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';

interface Props {
  exercise: Exercise;
}

export function ExerciseCard(props: Props) {
  const { exercise } = props;

  return (
    <Card sx={{ maxWidth: 345, borderRadius: 5 }}>
      <CardMedia
        // components="img"
        sx={{
          height: 140,
          background: 'linear-gradient(180deg, rgba(26,43,60,1) 0%, rgba(37,53,70,1) 100%)',
        }}
        image={exercise.imageUrl}
        title={exercise.name}
      />
      <CardContent>
        <Typography
          gutterBottom
          variant="h6"
          textAlign="center"
          fontWeight="bold"
          textTransform="uppercase"
        >
          {exercise.name}
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {exercise.components?.[0].name}
        </Typography>
      </CardContent>
    </Card>
  );
}