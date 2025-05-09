'use client';

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box } from '@mui/material';
import MainDashboardView from './main-view';

export default function Dashboard() {
  const screenSize = useScreenSize();

  return (
    <>
      <Box mt="16px" display="flex" flexDirection="row" width="100%">
        <Box
          sx={{
            width: screenSize.isMobile ? 0 : 50,
          }}
        >
          <DashboardSidebar
            organizations={organizations}
            selectedOrganization={selectedOrganization}
            setSelectedOrganization={setSelectedOrganization}
            role={role}
            view={view}
            setView={setView}
          />
        </Box>

        <MainDashboardView
          organization={organization}
          users={users}
          token={token}
          profile={profile}
          view={view}
        />
      </Box>
    </>
  );
}
