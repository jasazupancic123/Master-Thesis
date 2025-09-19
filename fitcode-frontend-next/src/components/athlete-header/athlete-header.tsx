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
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';

export default function AthleteHeader() {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const { user } = useAuthenticatedAuth();
  const { selectedTrackingMethod } = useAthleteHeader();

  if (selectedTrackingMethod === TrackingMethod.CAMERA) return null;

  return (
    <>
      <Box
        display="flex"
        width="100%"
        height={60}
        sx={{
          backgroundColor: theme.palette.background.light,
          justifyContent: 'space-between',
          px: screenSize.isMobile ? 1.5 : 6,
          pr: screenSize.isMobile ? 1.5 : 1,
          position: 'relative',
          alignItems: 'center',
        }}
      >
        {!screenSize.isLandscapeMobile && !screenSize.isMobile && <Sidebar />}
        <Typography
          sx={{
            color: 'text.primary',
            fontSize: 12,
          }}
        >
          {dayjs().format('DD-MMM-YY').toUpperCase()}
        </Typography>
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Tooltip title={user?.email}>
            <Link href={LINK_PROFILE.href} passHref>
              <Avatar
                className="avatar-border"
                src={user?.photoURL || '/user_avatar.png'} // Path to the image in the public folder
                sx={{
                  width: 40,
                  height: 40,
                  mx: 0,
                  my: 1,
                  cursor: 'pointer',
                }}
              />
            </Link>
          </Tooltip>
        </Box>

        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          gap={1}
        >
          <IconButton
            sx={{
              p: 0,
              m: 0,
              cursor: 'pointer',
            }}
          >
            <SettingsIcon
              style={{
                width: 20,
                height: 20,
              }}
            />
          </IconButton>
          {/* <IconButton
            sx={{
              p: 0,
              m: 0,
              cursor: 'pointer',
            }}
          >
            <Menu sx={{ fontSize: 24 }} />
          </IconButton> */}
        </Box>
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
    </>
  );
}
