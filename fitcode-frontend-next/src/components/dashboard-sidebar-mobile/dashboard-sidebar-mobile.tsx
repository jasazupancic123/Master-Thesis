'use client';

import { LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS } from '@/common/constant/navigation.constant';
import { useAuth } from '@/store/auth-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { LogoutRounded } from '@mui/icons-material';
import React from 'react';
import { useDashboard } from '@/store/dashboard-provider';
import { useRouter, usePathname } from 'next/navigation';
import { ILink } from '@/common/type/link.type';
import { useMain } from '@/store/main-provider';

export function DashboardMobileSidebar() {
  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const { profile } = useMain();
  const { logout } = useAuth();

  const role = profile.customClaims.role || [];

  const handleClick = (link: ILink, isSignOut = false) => {
    if (isSignOut) {
      logout();
    } else {
      router.push(link.href);
    }
  };

  return (
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
        zIndex: 10000,
      }}
    >
      {Object.entries(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role)).map(
        ([key, link], i) => {
          if (!link) return null;
          const isSignOut = key === 'signout';
          return (
            <IconButton
              key={i}
              sx={{
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
                zIndex: 1100,
                color: pathname?.endsWith(link.href)
                  ? theme.palette.primary.main
                  : '#fff',
              }}
              onClick={(event) => {
                handleClick(link, isSignOut);
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center">
                {link.icon}
                <Typography
                  variant="caption"
                  sx={{ color: 'inherit', fontSize: 12 }}
                >
                  {''}
                  {link.label.split(' ')[0]}
                </Typography>
              </Box>
            </IconButton>
          );
        }
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
  );
}
