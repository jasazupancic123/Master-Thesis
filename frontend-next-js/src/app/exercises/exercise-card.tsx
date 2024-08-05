import type { Exercise } from '@/type/exercise.type';
import { Card, CardContent, CardMedia } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';

interface Props {
  exercise: Exercise;
}

export function ExerciseCard(props: Props) {
  const { exercise } = props;

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        sx={{ height: 140 }}
        image={exercise.imageUrl ?? 'https://mui.com/static/images/cards/contemplative-reptile.jpg'}
        title={exercise.name}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {exercise.name}
        </Typography>
      </CardContent>
    </Card>
  );
}