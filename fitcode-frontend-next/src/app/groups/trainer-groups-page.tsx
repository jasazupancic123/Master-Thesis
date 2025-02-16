'use client';

import GroupSidebar from '@/components/group-sidebar';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GroupDateFilterButtonGroup from './group-date-filter-button-group';
import { GroupPageProps } from './props';

export default function TrainerGroupsPage(props: GroupPageProps) {
  const { groups } = props;

  const theme = useTheme();

  return (
    <>
      <Box mt={'16px'}>
        <GroupSidebar groups={groups} group={null} />
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          pb: 3,
        }}
      >
        <GroupDateFilterButtonGroup filter={'day'} setFilter={() => {}} />

        <Typography variant="h6" textAlign="center" mt={2} p={2}>
          Select a group
        </Typography>
      </Box>
    </>
  );
}
