'use client';

import { useScreenSize } from '@/store/screen-size-provider';
import GroupsIcon from '@mui/icons-material/Groups';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import SelectInputHorizontal from '../select-input-horizontal/select-input-horizontal';
import { AppBar } from '../group-sidebar/style';
import { Institution } from '@/controller/institution/type/institution.type';
import React from 'react';
import { useDashboard } from '@/store/dashboard-provider';
import { DashboardDesktopSidebar } from '../dashboard-sidebar-desktop/dashboard-sidebar-desktop';
import { DashboardMobileSidebar } from '../dashboard-sidebar-mobile/dashboard-sidebar-mobile';
import { useTheme } from '@mui/material';
import { isAdmin } from '@/common/service/util/firebase-auth.util';
import { useMain } from '@/store/main-provider';

export default function DashboardSidebar() {
  const screenSize = useScreenSize();
  const theme = useTheme();

  const { profile } = useMain();

  const { institutions, selectedInstitution, setSelectedInstitution } =
    useDashboard();

  const role = profile.customClaims.role;

  return (
    <Box sx={{ width: !screenSize.isMobile ? 50 : undefined }}>
      <Box sx={{ display: 'flex' }}>
        {!screenSize.isMobile ? (
          <DashboardDesktopSidebar />
        ) : (
          <DashboardMobileSidebar />
        )}

        {isAdmin(role) && (
          <AppBar
            position="fixed"
            sx={{
              width: '100%',
              transition: 'margin-left 0.3s ease-in-out',
              boxShadow: 'none',
            }}
          >
            <Toolbar
              sx={{
                height: '50px !important',
                minHeight: '50px !important',
                backgroundColor: theme.palette.background.default,
                ml: !screenSize.isMobile ? '50px' : undefined,
                px: '5px !important',
              }}
            >
              <Box ml={screenSize.isMobile ? 2 : 0}>
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
              </Box>
            </Toolbar>
          </AppBar>
        )}
      </Box>
    </Box>
  );
}
