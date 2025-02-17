import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Card, CardContent, CardMedia } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';

interface Props {
  exercise: Exercise;
}

export function ExerciseCard(props: Props) {
  const { exercise } = props;

  return (
    <Card
      sx={{
        borderRadius: 5,
        height: 250,
      }}
    >
      <CardMedia
        // components="video" or "img"
        component={
          exercise.videoUrl ? 'video' : exercise.imageUrl ? 'img' : 'div'
        }
        sx={{
          height: 140,
          background:
            'linear-gradient(180deg, rgba(26,43,60,1) 0%, rgba(37,53,70,1) 100%)',
        }}
        src={exercise.videoUrl || exercise.imageUrl}
        title={exercise.name}
        controls={exercise.videoUrl ? true : undefined}
        muted={exercise.videoUrl ? true : undefined}
        autoPlay={exercise.videoUrl ? true : undefined}
        loop={exercise.videoUrl ? true : undefined}
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
