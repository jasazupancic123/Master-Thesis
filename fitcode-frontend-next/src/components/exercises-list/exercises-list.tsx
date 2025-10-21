import { Box } from '@mui/material';
import { useTheme } from '@mui/material';

import { ExerciseCard } from '../exercise-card/exercise-card';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface ExercisesListProps {
  exercises: Exercise[];
  setSelectedExerciseIds?: SetState<string[]>;
  selectedExerciseIds?: string[];
  setModal?: SetState<{
    add: boolean;
    edit: boolean;
    import: boolean;
    muscleValues: boolean;
    confirmDelete: boolean;
  }>;
  setExercise?: SetState<Partial<Exercise>>;
  addExerciseForm?: boolean;
  children?: React.ReactNode;
}

export default function ExercisesList(props: ExercisesListProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const {
    exercises,
    setModal,
    setExercise,
    addExerciseForm,
    selectedExerciseIds,
    setSelectedExerciseIds,
    children,
  } = props;

  return (
    <Box
      id="exercises container"
      display="flex"
      flexWrap="wrap"
      justifyContent="center"
      gap={2}
      mb={10}
      maxWidth={
        !addExerciseForm
          ? undefined
          : screenSize.isUltraSmall
            ? 160
            : screenSize.isReallySmall
              ? '70%'
              : screenSize.isSmallMobile
                ? '100%'
                : undefined
      }
      sx={{
        mx: 'auto',
      }}
    >
      {exercises.map((exercise) => (
        <Box
          key={exercise.id}
          width={
            !screenSize.isTablet && !screenSize.isMobile
              ? '18%'
              : screenSize.isUltraSmall && addExerciseForm
                ? '100%'
                : screenSize.isSmallMobile && addExerciseForm
                  ? '45%'
                  : '40%'
          }
          sx={{
            cursor: 'pointer',
            border: `2px solid ${selectedExerciseIds?.includes(exercise.id) ? theme.palette.primary.main : 'transparent'}`,
            borderRadius: 5.5,
            boxShadow: selectedExerciseIds?.includes(exercise.id)
              ? `0 0 4px ${theme.palette.primary.main}`
              : undefined,
          }}
          onClick={() => {
            setModal?.((prev) => ({ ...prev, edit: true }));
            setExercise?.(exercise);
            if (selectedExerciseIds !== undefined) {
              if (selectedExerciseIds.includes(exercise.id))
                setSelectedExerciseIds?.(
                  selectedExerciseIds.filter((id) => id !== exercise.id)
                );
              else
                setSelectedExerciseIds?.([...selectedExerciseIds, exercise.id]);
            }
          }}
        >
          <ExerciseCard exercise={exercise} addExerciseForm />
        </Box>
      ))}
      {children}
    </Box>
  );
}
