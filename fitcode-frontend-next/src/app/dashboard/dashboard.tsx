'use client';

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useScreenSize } from '@/context/screen-size-provider';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Organization } from '@/controller/organization/type/organization.type';
import { User } from '@/controller/user/type/user.type';
import { useTheme } from '@mui/material';
import { Box } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainDashboardView from './main-view';
import AthletesView from './athletes-view';

interface DashboardProps {
  organization: Organization;
  organizations: Organization[] | null;
  role: string;
  users: User[];
  token: string;
  profile: User;
}

export default function Dashboard(props: DashboardProps) {
  const { organization, organizations, role, users, token, profile } = props;

  const screenSize = useScreenSize();

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(organization);

  const [view, setView] = useState<'mainView' | 'athletes'>('mainView');

  const renderView = () => {
    switch (view) {
      case 'mainView':
        return (
          <MainDashboardView
            organization={organization}
            users={users}
            token={token}
            profile={profile}
            view={view}
          />
        );
      case 'athletes':
        return (
          <MainDashboardView
            organization={organization}
            users={users}
            token={token}
            profile={profile}
            view={view}
          />
        );
      default:
        return <></>;
    }
  };

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
        {renderView()}
      </Box>
    </>
  );
}
