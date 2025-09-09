'use client';

import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import TrainerGroupHeader from '../components/trainer-group-header/trainer-group-header';
import GroupSidebar from '@/components/group-sidebar/group-sidebar';
import { useScreenSize } from '@/store/screen-size.provider';

export default function TrainerGroupsPage() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  return (
    <>
      <Box mt="16px" sx={{ px: screenSize.isMobile ? 1 : undefined }}>
        <GroupSidebar group={null} />
      </Box>
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          pb: 1,
        }}
      >
        <TrainerGroupHeader filter={'day'} setFilter={() => {}} />

        <Typography variant="h6" textAlign="center" mt={2} p={2}>
          Select a group
        </Typography>
      </Box>
    </>
  );
}
