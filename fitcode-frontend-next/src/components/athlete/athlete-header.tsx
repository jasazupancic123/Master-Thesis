'use client';

import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import * as React from 'react';

import AthleteSidebar from './athlete-sidebar';
import BottomNavigation from './bottom-navigation';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import Logo from '@/util/logo';

export default function AthleteHeader() {
  const theme = useTheme();
  const screenSize = useScreenSize();

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
          position="fixed"
          bottom={0}
          width="100%"
          display="flex"
          justifyContent="center"
          zIndex={1000}
        >
          {!screenSize.isLandscapeMobile && !screenSize.isMobile ? (
            <AthleteSidebar />
          ) : (
            <BottomNavigation />
          )}
        </Box>
      </Box>
    </>
  );
}
