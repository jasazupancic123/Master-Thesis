'use client';

import { useScreenSize } from '@/store/screen-size-provider';
import GroupsIcon from '@mui/icons-material/Groups';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Logo from '../logo/logo';
import SelectInputHorizontal from '../select-input-horizontal/select-input-horizontal';
import { AppBar } from '../group-sidebar/style';
import { Institution } from '@/controller/institution/type/institution.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import React from 'react';
import { useDashboard } from '@/store/dashboard-provider';
import { DashboardDesktopSidebar } from '../dashboard-sidebar-desktop/dashboard-sidebar-desktop';
import { DashboardMobileSidebar } from '../dashboard-sidebar-mobile/dashboard-sidebar-mobile';

export default function DashboardSidebar() {
  const screenSize = useScreenSize();

  const { role, institutions, selectedInstitution, setSelectedInstitution } =
    useDashboard();

  return (
    <Box sx={{ width: !screenSize.isMobile ? 50 : undefined }}>
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            transition: 'margin-left 0.3s ease-in-out',
            boxShadow: 'none',
            zIndex: 1500,
          }}
        >
          <Toolbar
            sx={{
              ml: screenSize.isMobile ? undefined : '50px',
              height: '50px !important',
              minHeight: '50px !important',
              pt: '2px',
              backgroundColor: 'background.default',
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Logo width={44.5} height={30} version="narrow" />
            </Box>

            {role === UserRole.ADMIN && (
              <SelectInputHorizontal<Institution>
                label={selectedInstitution?.name || 'Select institution'}
                icon={<GroupsIcon />}
                value={selectedInstitution?.id || ''}
                items={institutions || []}
                itemKey="id"
                itemName="name"
                setValue={(institutionId) => {
                  const institution = institutions?.find(
                    (i) => i.id === institutionId
                  );
                  if (institution) setSelectedInstitution(institution);
                }}
              />
            )}
          </Toolbar>
        </AppBar>

        {!screenSize.isMobile ? (
          <DashboardDesktopSidebar />
        ) : (
          <DashboardMobileSidebar />
        )}
      </Box>
    </Box>
  );
}
