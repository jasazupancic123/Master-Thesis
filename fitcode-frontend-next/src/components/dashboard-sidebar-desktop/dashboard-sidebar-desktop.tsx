'use client';

import {
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
  LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS,
} from '@/common/constant/navigation.constant';
import { useAuth } from '@/store/auth-provider';
import { Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Logo from '../logo/logo';
import { Drawer } from '../group-sidebar/style';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMain } from '@/store/main-provider';

export function DashboardDesktopSidebar() {
  const pathname = usePathname();

  const { profile } = useMain();
  const { logout } = useAuth();

  const role = profile.customClaims.role || [];

  return (
    <Drawer
      variant="permanent"
      sx={{
        zIndex: 5000,
        transition: 'width 0.3s ease-in-out',
        '& .MuiDrawer-paper': {
          width: '50px',
          transition: 'width 0.3s ease-in-out',
          overflowX: 'hidden',
          backgroundColor: 'background.dark',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          top: 0,
          width: '100%',
          justifyContent: 'flex-start',
        }}
      >
        <Box sx={{ px: 3, py: 1.5 }}>
          <Logo version="narrow" height={25} width={37} />
        </Box>
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
