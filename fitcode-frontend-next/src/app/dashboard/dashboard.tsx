'use client';

import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useScreenSize } from '@/context/screen-size-provider';
import { User } from '@/controller/user/type/user.type';
import { Box } from '@mui/material';
import { useState } from 'react';
import MainDashboardView from './main-view';
import { Organization } from '@/controller/organization/type/organization.type';

interface DashboardProps {
  organization: Organization;
  organizations: Organization[] | null;
  role: string;
  users: User[];
  token: string;
  profile: User;
}

export default function Dashboard(props: DashboardProps) {
  const screenSize = useScreenSize();
  const [view, setView] = useState<'mainView' | 'athletes'>('mainView');
  const { organization, organizations, role, users, token, profile } = props;
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(organization);

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
