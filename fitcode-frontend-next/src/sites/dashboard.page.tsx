'use client';

import { Typography } from '@mui/material';
import { Box } from '@mui/material';

import DashboardSchedule from '@/components/dashboard/dashboard-schedule';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import {
  INSTITUTION_PAGE_ID,
  LINK_DASHBOARD_ADD_INSTITUTION,
  LINK_DASHBOARD_EXERCISES,
  LINK_DASHBOARD_MEMBERS,
  LINK_DASHBOARD_PLANNING,
  LINK_DASHBOARD_REPORTS,
  LINK_DASHBOARD_SCHEDULE,
  LINK_DASHBOARD_SETTINGS,
} from '@/lib/common/const/nav.const';
import DashboardReports from '@/components/dashboard/dashboard-reports';
import DashboardMembers from '@/components/dashboard/dashboard-members';
import DashboardGroups from '@/components/dashboard/dashboard-groups';
import ExercisesPage from './exercises.page';
import DashboardAddInstitution from '@/components/dashboard/dashboard-add-institution-view';

export default function DashboardPage() {
  const { profile } = useMain();

  const { filter, institutions, selectedInstitution } = useDashboard();

  const renderContent = () => {
    switch (filter.id) {
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
        return <>Dashboard settings page</>;
      }
      case LINK_DASHBOARD_PLANNING.id: {
        return <DashboardGroups />;
      }
      case LINK_DASHBOARD_EXERCISES.id: {
        return <ExercisesPage />;
      }
      case LINK_DASHBOARD_ADD_INSTITUTION.id: {
        return <DashboardAddInstitution />;
      }
      case INSTITUTION_PAGE_ID: {
        return <Typography>Institution Page</Typography>;
      }
      default:
        return <DashboardSchedule />;
    }
  };

  if (!profile) return null;

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
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
        }}
      >
        {renderContent()}
      </Box>
    </>
  );
}
