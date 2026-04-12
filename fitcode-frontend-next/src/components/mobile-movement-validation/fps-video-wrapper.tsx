'use client';

import { PoseModel } from '@/core/exercise-ai-prescriptions/enum/pose-model.enum';
import { Box, MenuItem, Select, Typography } from '@mui/material';
import { useState } from 'react';
import MobileMovementValidation from './mobile-movement-validation';

export default function FpsVideoWrapper() {
  const [poseModel, setPoseModel] = useState<PoseModel | null>(null);

  if (!poseModel) {
    return (
      <Box
        width="100%"
        height="100dvh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <Typography>Select pose model</Typography>
        <Select
          value={poseModel || ''}
          onChange={(e) => setPoseModel(e.target.value as PoseModel)}
        >
          {Object.values(PoseModel).map((model) => (
            <MenuItem key={model} value={model}>
              {model}
            </MenuItem>
          ))}
        </Select>
      </Box>
    );
  }

  return (
    <MobileMovementValidation
      userId={''}
      selectedExercise={undefined}
      selectedTrackingMethod={undefined}
      setSelectedTrackingMethod={undefined}
      trainingId="trainingId"
      componentId="componentId"
      supersetIndex={0}
      setIndex={0}
      setSelectedExercise={undefined}
      passedPoseModel={poseModel}
    />
  );
}
