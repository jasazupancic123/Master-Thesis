'use client';

import { Box, Typography } from '@mui/material';

import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardGroupsMembers from './dashboard-groups-members';
import DashboardPageContainer from './dashboard-page-container';
import { useDashboard } from '@/store/dashboard.provider';

export default function DashboardMembers() {
  const { selectedGroup } = useDashboard();

  if (!selectedGroup) return null;

  return (
    <DashboardPageContainer>
      <Box
        width="100%"
        height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {[
          { title: 'Trainers', number: selectedGroup.trainerIds.length },
          { title: 'Athletes', number: selectedGroup.membersIds.length },
        ].map(({ title, number }, index) => (
          <Box
            width="40%"
            key={title}
            display="flex"
            alignItems="center"
            justifyContent={index === 0 ? 'flex-end' : 'flex-start'}
            gap={1}
            sx={{
              px: 2,
            }}
          >
            <Box display="flex" flexDirection="column">
              <Typography
                fontSize={26}
                fontWeight={400}
                textAlign="center"
                sx={{
                  userSelect: 'none',
                }}
              >
                {number}
              </Typography>
              <Typography
                fontSize={14}
                textAlign="center"
                sx={{
                  userSelect: 'none',
                }}
              >
                {title}
              </Typography>
            </Box>
          </Box>
        ))}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          maxWidth={MAX_WIDTH}
          sx={{ overflowX: 'auto' }}
        ></Box>
      </Box>
      <DashboardGroupsMembers />
    </DashboardPageContainer>
  );
}
