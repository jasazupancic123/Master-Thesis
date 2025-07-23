'use client';

import Logo from '@/components/logo/logo';
import { useScreenSize } from '@/store/screen-size-provider';
import Box from '@mui/material/Box';
import * as React from 'react';
import { useEffect, useState } from 'react';
import BottomNavigation from '../bottom-navigation/bottom-navigation';
import Sidebar from '../sidebar/sidebar';
import { Avatar, IconButton, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAthlete } from '@/store/athlete-provider';
import { useAuth } from '@/store/auth-provider';
import { Settings } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import Link from 'next/link';
import {
  LINK_PROFILE,
  LINK_TRAININGS,
} from '@/common/constant/navigation.constant';

export default function AthleteHeader() {
  const { selectedDate, setSelectedDate, filter } = useAthlete();

  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const { profile, user } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState(profile?.profileImageUrl);

  useEffect(() => {
    setAvatarSrc(profile?.profileImageUrl);
  }, [profile]);

  return (
    <>
      <Box
        display="flex"
        width="100%"
        height={70}
        sx={{
          backgroundColor: theme.palette.background.light,
          justifyContent: 'space-between',
          px: screenSize.isMobile
            ? 1.5
            : screenSize.isSmallerThanLaptop
              ? 5
              : 10,
          position: 'relative',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
            fontSize: screenSize.isGigaSmall ? 16 : 18,
          }}
        >
          {filter.label}
        </Typography>
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Logo width={screenSize.isGigaSmall ? 40 : 52} height={screenSize.isGigaSmall ? 27 : 35} version="narrow" />
        </Box>

        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          gap={1}
        >
          <Tooltip title={user?.email}>
            <Link href={LINK_PROFILE.href} passHref legacyBehavior>
              <Avatar
                className="avatar-border"
                src={avatarSrc || '/user_avatar.png'} // Path to the image in the public folder
                sx={{
                  width: screenSize.isGigaSmall ? 30 : 35,
                  height: screenSize.isGigaSmall ? 30 : 35,
                  mx: 0,
                  my: 1,
                  cursor: 'pointer',
                }}
              />
            </Link>
          </Tooltip>
          <Tooltip title={user?.email}>
            <IconButton
              sx={{
                p: 0,
                m: 0,
                cursor: 'pointer',
              }}
            >
              <Settings
                sx={{
                  width: screenSize.isGigaSmall ? 25 : 30,
                  height: screenSize.isGigaSmall ? 25 :30,
                }}
              />
            </IconButton>
          </Tooltip>
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
