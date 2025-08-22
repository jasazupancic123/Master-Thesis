import Box from '@mui/material/Box/Box';

import AthleteTrainingExerciseCollapsed from '../athlete-training-exercise-collapsed/athlete-training-exercise-collapsed';
import type { Superset } from '@/controller/training/type/superset.type';
import { getBorderGradient } from '../superset/state';

interface AthleteSupersetProps {
  superset: Superset;
  supersetIndex: number;
  supersets: Superset[];
}

export default function AthleteSuperset(props: AthleteSupersetProps) {
  const { superset, supersetIndex, supersets } = props;
  return (
    <Box width="100%" display="flex" flexDirection="column">
      <Box
        sx={{
          p: '1px',
          borderRadius: '5px',
          background: getBorderGradient(
            supersetIndex,
            supersets.length === 1 ||
              (supersets.length === 5 && supersetIndex === 4)
          ),
        }}
      >
        {superset.exercises.map((exercise, i) => (
          <AthleteTrainingExerciseCollapsed
            key={exercise.id}
            exercise={exercise}
            borderTopRadius={i === 0}
            borderBottomRadius={i === superset.exercises.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
}
