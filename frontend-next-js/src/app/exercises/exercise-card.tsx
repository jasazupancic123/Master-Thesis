import type { Exercise } from '@/type/exercise.type';
import { Card, CardContent, CardMedia } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';
import { FirebaseStorage } from '@/util/firebase';
import { getFilenameFromPath } from '@/util/link';

interface Props {
  exercise: Exercise;
}

export function ExerciseCard(props: Props) {
  const { exercise } = props;
  const imageUrl = FirebaseStorage.exerciseUrl(getFilenameFromPath(exercise.imageUrl || ''));

  return (
    <Card sx={{ maxWidth: 345, borderRadius: 5 }}>
      <CardMedia
        // component="img"
        sx={{
          height: 140,
          background: 'linear-gradient(180deg, rgba(26,43,60,1) 0%, rgba(37,53,70,1) 100%)',
        }}
        image={exercise.imageUrl ? imageUrl : undefined}
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
          {exercise.components?.[0]}
        </Typography>
      </CardContent>
    </Card>
  );
}