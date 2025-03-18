'use client';

import {
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
  LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS,
} from '@/common/constant/navigation.constant';
import { useAuth } from '@/context/auth-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuIcon from '@mui/icons-material/Menu';
import {
  BottomNavigation,
  BottomNavigationAction,
  Tooltip,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import { useState } from 'react';
import Logo from '../logo';
import SelectInputHorizontal from '../select-input-horizontal';
import { handleLinkClick } from '../dashboard-sidebar/state';
import { AppBar, Drawer, DrawerHeader } from '../group-sidebar/style';
import { Organization } from '@/controller/organization/type/organization.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { LogoutRounded } from '@mui/icons-material';
import React from 'react';

interface DashboardSidebarProps {
  role: string;
  organizations: Organization[] | null;
  selectedOrganization: Organization | null;
  setSelectedOrganization: (organization: Organization) => void;
  view: 'mainView' | 'athletes';
  setView: (view: 'mainView' | 'athletes') => void;
}

export default function DashboardSidebar(props: DashboardSidebarProps) {
  const {
    role,
    organizations,
    selectedOrganization,
    setSelectedOrganization,
    view,
    setView,
  } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();

  const { logout } = useAuth();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          transition: 'margin-left 0.3s ease-in-out',
          boxShadow: 'none',
          zIndex: 1100,
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
            <SelectInputHorizontal<Organization>
              label={selectedOrganization?.name || 'Select group'}
              icon={<GroupsIcon />}
              value={selectedOrganization?.id || ''}
              items={organizations || []}
              itemKey="id"
              itemName="name"
              setValue={(organizationId) => {
                if (!selectedOrganization) return;
                const organization = organizations?.find(
                  (organization) => organization.id === organizationId
                );
                if (organization) setSelectedOrganization(organization);
              }}
            />
          )}
        </Toolbar>
      </AppBar>

      {!screenSize.isMobile ? (
        <Drawer
          variant="permanent"
          sx={{
            zIndex: 1200,
            transition: 'width 0.3s ease-in-out',
            '& .MuiDrawer-paper': {
              width: '50px',
              transition: 'width 0.3s ease-in-out',
              overflowX: 'hidden',
              backgroundColor: '#344352',
            },
          }}
        >
          <Box
            sx={{
              zIndex: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              top: 0,
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            <IconButton
              sx={{ cursor: role === UserRole.ADMIN ? 'pointer' : 'default' }}
              disableRipple={role === UserRole.ADMIN ? false : true}
            >
              <Logo
                width={29.5}
                height={25}
                version="narrow"
                sx={{ paddingTop: 3, paddingBottom: 3 }}
              />
            </IconButton>
            {Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS()).map(
              (link, i) => (
                <Tooltip title={link.label} placement="right" key={i}>
                  <ListItem
                    disablePadding
                    sx={{
                      display: 'block',
                      backgroundColor:
                        link.href === view ? 'primary.main' : undefined,
                    }}
                  >
                    <IconButton
                      sx={{ width: '100%', p: 0, m: 0 }}
                      onClick={(event) =>
                        setView(link.href as 'mainView' | 'athletes')
                      }
                      disableRipple
                    >
                      <ListItemButton
                        disableRipple
                        disableTouchRipple
                        sx={[
                          { minHeight: 48, px: 0, py: 0 },
                          { justifyContent: 'initial' },
                        ]}
                      >
                        <ListItemIcon
                          sx={[
                            {
                              minWidth: 0,
                              width: '100%',
                              justifyContent: 'center',
                            },
                          ]}
                        >
                          {link.icon}
                        </ListItemIcon>
                      </ListItemButton>
                    </IconButton>
                  </ListItem>
                </Tooltip>
              )
            )}
          </Box>

          <Divider />

          <List>
            {Object.entries(LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS).map(
              ([key, link], i) => {
                return (
                  <Tooltip title={link.label} placement="right" key={i}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        sx={[
                          { minHeight: 48, px: 2.5 },
                          { justifyContent: 'initial' },
                        ]}
                        onClick={() => {
                          if (key === 'signout') logout();
                        }}
                      >
                        <ListItemIcon
                          sx={[
                            {
                              minWidth: 0,
                              width: '100%',
                              justifyContent: 'center',
                            },
                          ]}
                        >
                          {link.icon}
                        </ListItemIcon>
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                );
              }
            )}
          </List>
        </Drawer>
      ) : (
        <Box
          display="flex"
          width="100%"
          gap={1}
          sx={{
            position: 'fixed',
            backgroundColor: 'background.paper',
            justifyContent: 'center',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
          }}
        >
          {Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS()).map(
            (link, i) => (
              <IconButton
                key={i}
                sx={{
                  color:
                    view === link.href ? theme.palette.primary.main : '#fff',
                  minWidth: '48px', // Reduce the minimum width
                  padding: '4px', // Reduce padding
                  '& .MuiBottomNavigationAction-root': {
                    minWidth: '48px', // Override MUI default min-width
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: screenSize.isLandscapeMobile
                      ? '24px !important'
                      : '27.5px !important', // Force smaller icon
                  },
                }}
              >
                <Box display="flex" flexDirection="column" alignItems="center">
                  {link.icon}
                  <Typography
                    variant="caption"
                    sx={{ color: 'inherit', fontSize: 12 }}
                  >
                    {''}
                    {link.label}
                  </Typography>
                </Box>
              </IconButton>
            )
          )}
          {
            <IconButton
              key="logout"
              onClick={logout}
              sx={{
                minWidth: '48px',
                padding: '4px',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: '48px',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '27.5px !important',
                },
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center">
                <LogoutRounded
                  sx={{
                    color: 'rgb(104, 115, 123)',
                    fontSize: screenSize.isLandscapeMobile ? 20 : undefined,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: 'inherit', fontSize: 12 }}
                >
                  Logout
                </Typography>
              </Box>
            </IconButton>
          }
        </Box>
      )}
    </Box>
  );
}
