import { theme } from '@/app/style';
import { Exercise } from '@/core/exercise/type/exercise.type';
import { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { Close, CloseOutlined } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useEffect, useState } from 'react';

interface Props {
  newAddedExercisesIds: string[];
  setNewAddedExercisesIds: SetState<string[]>;
  setSelectedExerciseIds: SetState<string[]>;
}

export default function SelectedExercisesList(props: Props) {
  const { exercises } = useMain();

  const {
    newAddedExercisesIds,
    setNewAddedExercisesIds,
    setSelectedExerciseIds,
  } = props;

  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const selected = exercises.filter((exercise) =>
      newAddedExercisesIds.includes(exercise.id)
    );

    setSelectedExercises(selected);
  }, [newAddedExercisesIds]);
  return (
    <Box
      width="100%"
      display="flex"
      flexWrap="wrap"
      justifyContent="flex-start"
      gap={1}
      mb={1}
    >
      {selectedExercises.map((exercise) => (
        <Box
          display="flex"
          alignItems="center"
          key={exercise.id}
          sx={{
            py: 0.5,
            px: 1,
            borderRadius: 4,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.secondary,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {exercise.name}
          <IconButton
            sx={{
              p: 0,
              m: 0,
            }}
            onClick={() => {
              setNewAddedExercisesIds((prev) =>
                prev.filter((id) => id !== exercise.id)
              );
              setSelectedExerciseIds((prev) =>
                prev.filter((id) => id !== exercise.id)
              );
            }}
          >
            <CloseOutlined
              sx={{
                color: theme.palette.text.secondary,
                fontSize: 16,
              }}
            />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}
