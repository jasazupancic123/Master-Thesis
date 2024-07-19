import type { Exercise } from '@/type/exercise.type';
import { Card, CardContent, CardMedia } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';

export function ExerciseCard(item: Exercise) {
  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        sx={{ height: 140 }}
        image={item.imageUrl ?? 'https://mui.com/static/images/cards/contemplative-reptile.jpg'}
        title={item.name}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {item.componentIds.join(', ')}
        </Typography>
      </CardContent>
    </Card>
  );
}