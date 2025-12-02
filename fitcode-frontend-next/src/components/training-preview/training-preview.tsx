'use client';

import { Box } from '@mui/material';

import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import TrainingPreviewInfoHeader from './training-preview-info-header';
import TrainingPreviewMembers from './training-preview-members';
import VerticalLinesBorders from '@/ui/vertical-lines-borders';

export default function TrainingPreview() {
  return (
    <Box
      width={MAX_WIDTH}
      display="flex"
      flexDirection="column"
      alignItems="center"
      position="relative"
      sx={{
        minHeight: 'calc(100dvh - 50px)',
        mx: 'auto',
        overflowY: 'none',
      }}
      gap={2}
    >
      <VerticalLinesBorders />

      <TrainingPreviewInfoHeader />

      <TrainingPreviewMembers />
    </Box>
  );
}
