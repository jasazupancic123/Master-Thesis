'use client';

import { Avatar, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import * as React from 'react';

import AthleteSidebar from './athlete-sidebar';
import BottomNavigation from './bottom-navigation';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import Logo from '@/ui/logo';

export default function AthleteHeader() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { user } = useAuthenticatedAuth();

  const { selectedTrackingMethod } = useAthleteHeader() || {};
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
        {!screenSize.isLandscapeMobile && !screenSize.isMobile && (
          <AthleteSidebar />
        )}

        <Box
          sx={{
            px: screenSize.isMobile ? 2.5 : 6,
          }}
        >
          <Logo width={100} />
        </Box>

        <Box
          sx={{
            px: 1,
          }}
        >
          <Avatar
            src={user?.photoURL || USER_AVATAR_IMG_URL}
            sx={{
              width: 32,
              height: 32,
            }}
          />
        </Box>

        {!screenSize.isLandscapeMobile && !screenSize.isMobile ? (
          <AthleteSidebar />
        ) : (
          <Box
            position="fixed"
            bottom={0}
            width="100%"
            display="flex"
            justifyContent="center"
            zIndex={1000}
          >
            <BottomNavigation />
          </Box>
        )}
      </Box>
    </>
  );
}
