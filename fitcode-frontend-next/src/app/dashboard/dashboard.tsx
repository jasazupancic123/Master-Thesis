'use client';

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import MainDashboardView from '../../components/dashboard/main-view';
import {
  DASHBOARD_ADD_INSTITUTION_VIEW,
  DASHBOARD_GROUPS_VIEW,
  DASHBOARD_MAIN_VIEW,
  DASHBOARD_REGISTER_USERS_VIEW,
  DASHBOARD_VIEWS,
} from '@/components/dashboard/constant/dashboard-views-constant';
import AddInstitutionDashboardView from '../../components/dashboard/add-institution-view';
import { GroupController } from '@/controller/group/group.controller';
import { useDashboard } from '@/context/dashboard-provider';
import { Institution } from '@/controller/institution/type/institution.type';
import RegisterUsersView from '@/components/dashboard/register-users-view';

export default function Dashboard() {
  const screenSize = useScreenSize();
  const [view, setView] =
    useState<(typeof DASHBOARD_VIEWS)[number]>(DASHBOARD_MAIN_VIEW);
  const {
    token,
    selectedInstitution,
    setSelectedInstitution,
    setSelectedGroup,
  } = useDashboard();

  useEffect(() => {
    // fetch groups when selected institution changes
    if (!selectedInstitution || selectedInstitution.groups) return;
    const fetchGroups = async () => {
      const groups = await GroupController.findAllByInstitution(
        token,
        selectedInstitution.id
      );
      setSelectedInstitution(
        (prev) =>
          ({
            ...prev,
            groups: groups,
          }) as Institution
      );
      if (groups.length) setSelectedGroup(groups[0]);
    };
    fetchGroups();
  }, [selectedInstitution]);

  const renderView = () => {
    switch (view) {
      case DASHBOARD_MAIN_VIEW:
        return <MainDashboardView view={view} />;
      case DASHBOARD_GROUPS_VIEW:
        return <MainDashboardView view={view} />; //athletes view is inside main view
      case DASHBOARD_ADD_INSTITUTION_VIEW:
        return <AddInstitutionDashboardView />;
      case DASHBOARD_REGISTER_USERS_VIEW:
        return <RegisterUsersView />;
      default:
        return <MainDashboardView view={DASHBOARD_MAIN_VIEW} />;
    }
  };

  return (
    <>
      <Box mt="16px" display="flex" flexDirection="row" width="100%">
        {!screenSize.isMobile && (
          <Box sx={{ width: 50 }}>
            <DashboardSidebar view={view} setView={setView} />
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {renderView()}
        </Box>
      </Box>
    </>
  );
}
