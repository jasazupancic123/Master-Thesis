import { Box } from '@mui/material';
import { useState } from 'react';

import { TrainingInProgressExerciseControl } from '../enum/exercise-controls.enum';

export default function useExerciseControls(iconsDimension: number) {
  const numItems = 7;
  const boxWidth = `${100 / numItems}%`;

  const [selectedControl, setSelectedControl] =
    useState<TrainingInProgressExerciseControl>(
      TrainingInProgressExerciseControl.TEMPO
    );

  const getExerciseControlsIcon = (
    control: TrainingInProgressExerciseControl,
    selected?: boolean
  ) => {
    const url = `/exercise-controls/${control.toLowerCase()}/${control.toLowerCase()}${selected ? '-selected' : ''}.png`;

    return (
      <Box
        component="img"
        width={iconsDimension}
        height={iconsDimension}
        src={url}
        sx={{
          objectFit: 'contain',
        }}
      />
    );
  };

  return {
    boxWidth,
    getExerciseControlsIcon,
    selectedControl,
    setSelectedControl,
  };
}
