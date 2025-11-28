'use client';

import { Box } from '@mui/material';
import { useCoachTraining } from '@/store/coach-training.provider';
import TrainingPreviewMembers from './training-preview-members';

export default function TrainingPreview() {
  const { training } = useCoachTraining();

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <TrainingPreviewMembers />
    </Box>
  );
}
