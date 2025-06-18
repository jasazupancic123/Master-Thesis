'use client';

import {
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
  LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS,
} from '@/common/constant/navigation.constant';
import { useAuth } from '@/store/auth-provider';
import { Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Logo from '../logo/logo';
import { Drawer } from '../group-sidebar/style';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import React from 'react';
import { useDashboard } from '@/store/dashboard-provider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function DashboardDesktopSidebar() {
  const pathname = usePathname();

  const { role, selectedInstitution } = useDashboard();
  const { logout } = useAuth();

  return (
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
        <Tooltip title={selectedInstitution?.name || ''} placement="right">
          <IconButton
            sx={{
              cursor: role === UserRole.ADMIN ? 'pointer' : 'default',
            }}
            disableRipple={role === UserRole.ADMIN ? false : true}
          >
            {selectedInstitution?.imageUrl ? (
              <img
                src={selectedInstitution.imageUrl}
                alt="Institution Logo"
                width={30}
                height={30}
                style={{ borderRadius: '50%' }}
              />
            ) : (
              <Logo
                width={29.5}
                height={25}
                version="narrow"
                sx={{ paddingTop: 3, paddingBottom: 3 }}
              />
            )}
          </IconButton>
        </Tooltip>
        {Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role)).map(
          (link, i) => {
            if (!link) return null;

            return (
              <Tooltip title={link.label} placement="right" key={i}>
                <ListItem
                  disablePadding
                  sx={{
                    display: 'block',
                    backgroundColor: pathname?.endsWith(link.href)
                      ? 'primary.main'
                      : undefined,
                  }}
                >
                  <Link href={link.href} passHref legacyBehavior>
                    <ListItemButton
                      component="a"
                      disableRipple
                      disableTouchRipple
                      sx={{
                        minHeight: 48,
                        px: 0,
                        py: 0,
                        justifyContent: 'initial',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        {link.icon}
                      </ListItemIcon>
                    </ListItemButton>
                  </Link>
                </ListItem>
              </Tooltip>
            );
          }
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
  );
}
