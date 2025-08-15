import Box from '@mui/material/Box/Box';

import AthleteTrainingExerciseCollapsed from '../athlete-training-exercise-collapsed/athlete-training-exercise-collapsed';
import BorderColor from '../border-color/border-color';
import type { Superset } from '@/controller/training/type/superset.type';
import { COLOR } from '@/common/constant/color.constant';

interface AthleteSupersetProps {
  superset: Superset;
  supersetIndex: number;
}

export default function AthleteSuperset(props: AthleteSupersetProps) {
  const { superset, supersetIndex } = props;
  return (
    <Box width="100%" display="flex" flexDirection="column">
      <BorderColor
        color={COLOR[supersetIndex % COLOR.length]}
        applyMargin
        marginValue={superset.exercises.length === 0 ? '3px' : '5px'}
      />
      {superset.exercises.map((exercise) => (
        <AthleteTrainingExerciseCollapsed
          key={exercise.id}
          exercise={exercise}
        />
      ))}
      <BorderColor
        lower
        color={COLOR[supersetIndex % COLOR.length]}
        applyMargin
        marginValue={superset.exercises.length === 0 ? '3px' : '5px'}
      />
    </Box>
  );
}
