import type { Exercise } from '@/exercise/entity/exercise.entity';
import Typography from '@mui/material/Typography';
import { Card, CardContent, CardMedia } from '@mui/material';
import React, { useState } from 'react';
import Stack from '@mui/material/Stack';

interface Props {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  setSelectedExercises: (exercises: Exercise[]) => void;
}

export default function ExerciseList(props: Props) {
  const { exercises, selectedExercises, setSelectedExercises } = props;
  const [global, setGlobal] = useState(true);

  return (
    <Stack direction="row" spacing={1} mt={5}>
      {exercises.map((exercise) => (
        <Card
          key={exercise.id}
          sx={{
            width: 120,
            cursor: 'pointer',
          }}
          onClick={() => {
            const index = selectedExercises.findIndex(e => e.id === exercise.id);
            if (index === -1) {
              setSelectedExercises([...selectedExercises, exercise]);
            } else {
              setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
            }
          }}
        >
          <CardMedia
            sx={{ height: 160 }}
            image={exercise.imageUrl ?? 'https://mui.com/static/images/cards/contemplative-reptile.jpg'}
            title={exercise.name}
          />
          <CardContent
            sx={{
              backgroundColor: selectedExercises.find(e => e.id === exercise.id) ? 'primary.main' : '#1A2B3C',
            }}
          >
            <Typography gutterBottom variant="caption" component="div">
              {exercise.name}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}