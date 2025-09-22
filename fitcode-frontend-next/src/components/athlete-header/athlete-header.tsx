'use client';

import { Avatar, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import Link from 'next/link';
import * as React from 'react';

import BottomNavigation from '../bottom-navigation/bottom-navigation';
import Sidebar from '../sidebar/sidebar';
import SettingsIcon from '@/assets/icons/Settings.svg';
import { LINK_PROFILE } from '@/common/constant/navigation.constant';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import Logo from '../logo/logo';
import { MAX_WIDTH } from '../trainer-day-view/constant';

export default function AthleteHeader() {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const { user } = useAuthenticatedAuth();

  const athleteHeaderContext = useAthleteHeader();

  const { selectedTrackingMethod } = athleteHeaderContext || {};

  if (selectedTrackingMethod === TrackingMethod.CAMERA) return null;

  return (
    <>
      <Box
        display="flex"
        width="100%"
        height={47}
        maxWidth={MAX_WIDTH}
        sx={{
          backgroundColor: theme.palette.background.light,
          justifyContent: 'space-between',
          position: 'relative',
          alignItems: 'center',
        }}
      >
        {!screenSize.isLandscapeMobile && !screenSize.isMobile && <Sidebar />}

        <Box
          sx={{
            px: screenSize.isMobile ? 2.5 : 6,
          }}
        >
          <Logo width={100} />
        </Box>

        <Box
          position="fixed"
          bottom={0}
          width="100%"
          display="flex"
          justifyContent="center"
          zIndex={1000}
        >
          {!screenSize.isLandscapeMobile && !screenSize.isMobile ? (
            <Sidebar />
          ) : (
            <BottomNavigation />
          )}
        </Box>
      </Box>
    </>
  );
}
