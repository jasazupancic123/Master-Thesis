'use client';

import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { Box, IconButton, Tooltip } from '@mui/material';
import TrainerGroupPage from './trainer-group-page';

export default function TrainerGroupPageContainer() {
  const { handleUpdateGroup, handleUpdateTraining } = useGroup();
  const screenSize = useScreenSize();
  const { filter } = useGroup();

  return screenSize.isSmallerThanLaptop ? (
    <TrainerGroupPage />
  ) : (
    <Box
      display="flex"
      width="100%"
      alignItems="center"
      justifyContent="center"
      sx={{ pl: 6 }}
    >
      <TrainerGroupPage />

      <Tooltip
        title={
          filter === 'day'
            ? 'Save training'
            : filter === 'year'
              ? 'Save cycles'
              : ''
        }
      >
        <IconButton
          onClick={() => {
            if (filter === 'day') handleUpdateTraining();
            else if (filter === 'year') handleUpdateGroup();
          }}
          sx={{
            pr: 1,
            ml: 2,
            visibility:
              filter === 'cycle' || filter === 'week' ? 'hidden' : 'visible', // Keep space but hide visually
          }}
        >
          <SaveAsIcon sx={{ mr: 0, cursor: 'pointer' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
