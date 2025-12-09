'use client';

import { Refresh } from '@mui/icons-material';
import { IconButton, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/material';

import ExercisesPage from './exercises.page';
import DashboardAddInstitution from '@/components/dashboard/dashboard-add-institution-view';
import DashboardInstitution from '@/components/dashboard/dashboard-institution';
import DashboardReports from '@/components/dashboard/dashboard-reports';
import DashboardSchedule from '@/components/dashboard/dashboard-schedule';
import DashboardHome from '@/components/dashboard-home/dashboard-home';
import DashboardMembers from '@/components/dashboard-members/dashboard-members';
import MethodsDataGrid from '@/components/methodology/methods-data-grid';
import { MAX_WIDTH_DASHBOARD_ITEM } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { Methods } from '@/core/exercise/constant/method.constant';
import { lib } from '@/lib';
import {
  INSTITUTION_PAGE_ID,
  LINK_DASHBOARD_ADD_INSTITUTION,
  LINK_DASHBOARD_EXERCISES,
  LINK_DASHBOARD_HOME,
  LINK_DASHBOARD_MEMBERS,
  LINK_DASHBOARD_PLANNING,
  LINK_DASHBOARD_REPORTS,
  LINK_DASHBOARD_SCHEDULE,
  LINK_DASHBOARD_SETTINGS,
  LINK_METHODOLOGIES,
} from '@/lib/common/const/nav.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function DashboardPage() {
  const { role } = useAuthenticatedAuth();
  const { profile, reloadExercises } = useMain();
  const { filter, institutions, selectedInstitution } = useDashboard();

  const renderContent = () => {
    switch (filter.id) {
      case LINK_DASHBOARD_HOME.id: {
        return <DashboardHome />;
      }
      case LINK_DASHBOARD_SCHEDULE.id: {
        return <DashboardSchedule />;
      }
      case LINK_DASHBOARD_REPORTS.id: {
        return <DashboardReports />;
      }
      case LINK_DASHBOARD_MEMBERS.id: {
        return <DashboardMembers />;
      }
      case LINK_DASHBOARD_SETTINGS.id: {
        return (
          <Box>
            <Tooltip title="Refresh Exercises">
              <IconButton onClick={reloadExercises}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
      case LINK_DASHBOARD_PLANNING.id: {
        // We have modal for this
        return <></>;
      }
      case LINK_DASHBOARD_EXERCISES.id: {
        return <ExercisesPage />;
      }
      case LINK_DASHBOARD_ADD_INSTITUTION.id: {
        return <DashboardAddInstitution />;
      }
      case LINK_METHODOLOGIES.id: {
        return <MethodsDataGrid items={Methods} />;
      }
      case INSTITUTION_PAGE_ID: {
        return <DashboardInstitution />;
      }
      default:
        return <DashboardSchedule />;
    }
  };

  if (!profile && !lib.firebase.auth.isAdmin(role)) return null;

  if (!institutions.length)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Typography variant="h6">No institutions available</Typography>
      </Box>
    );

  if (!selectedInstitution)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Typography variant="h6">No institution selected</Typography>
      </Box>
    );

  return (
    <>
      <Box
        width="100%"
        maxWidth={MAX_WIDTH_DASHBOARD_ITEM}
        height="100%"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          mx: 'auto',
        }}
      >
        {renderContent()}
      </Box>
    </>
  );
}
