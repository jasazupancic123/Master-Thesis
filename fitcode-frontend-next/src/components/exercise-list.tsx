import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Card, CardContent, CardMedia } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface Props {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  setSelectedExercises: (exercises: Exercise[]) => void;
}

export default function ExerciseList(props: Props) {
  const { exercises, selectedExercises, setSelectedExercises } = props;

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
            const index = selectedExercises.findIndex(
              (e) => e.id === exercise.id
            );
            if (index === -1) {
              setSelectedExercises([...selectedExercises, exercise]);
            } else {
              setSelectedExercises(
                selectedExercises.filter((e) => e.id !== exercise.id)
              );
            }
          }}
        >
          <CardMedia
            sx={{ height: 160 }}
            image={
              exercise.imageUrl ??
              'https://mui.com/static/images/cards/contemplative-reptile.jpg'
            }
            title={exercise.name}
          />
          <CardContent
            sx={{
              backgroundColor: selectedExercises.find(
                (e) => e.id === exercise.id
              )
                ? 'primary.main'
                : '#1A2B3C',
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
