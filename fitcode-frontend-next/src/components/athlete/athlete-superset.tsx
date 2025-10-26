import { useTheme } from '@mui/material';
import Box from '@mui/material/Box/Box';
import { Fragment, useState } from 'react';

import AthleteTrainingExerciseCollapsed from './athlete-training-exercise-collapsed';
import AthleteTrainingExerciseSets from './athlete-training-exercise-sets';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import { lib } from '@/lib';

interface Props {
  superset: Superset;
  training: Training;
}

export default function AthleteSuperset({ superset, training }: Props) {
  const theme = useTheme();
  const [expandedSetsView, setExpandedSetsView] = useState(false);

  return (
    <Box width="100%" display="flex" flexDirection="column">
      <Box
        sx={{
          p: '1px',
          borderRadius: '5px',
          background: lib.common.component.getBorderGradient(theme),
        }}
      >
        {superset.exercises.map((exercise, i) => (
          <Fragment key={exercise.id}>
            <AthleteTrainingExerciseCollapsed
              exercise={exercise}
              borderTopRadius={i === 0}
              borderBottomRadius={
                i === superset.exercises.length - 1 && !expandedSetsView
              }
              displaySetsArrow={i === 0}
              expandedSetsView={expandedSetsView}
              setExpandedSetsView={setExpandedSetsView}
            />

            {expandedSetsView && (
              <AthleteTrainingExerciseSets
                key={exercise.id}
                training={training}
                exercise={exercise}
                borderBottomRadius={i === superset.exercises.length - 1}
                expanded={expandedSetsView}
              />
            )}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}
