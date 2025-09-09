'use client';

import Menu from '@mui/icons-material/Menu';
import { Avatar, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import Link from 'next/link';
import * as React from 'react';
import { useEffect, useState } from 'react';

import BottomNavigation from '../bottom-navigation/bottom-navigation';
import Sidebar from '../sidebar/sidebar';
import SettingsIcon from '@/assets/icons/Settings.svg';
import { LINK_PROFILE } from '@/common/constant/navigation.constant';
import { useAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';

export default function AthleteHeader() {
  const theme = useTheme();
  const screenSize = useScreenSize();
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
        height={60}
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
                src={avatarSrc || '/user_avatar.png'} // Path to the image in the public folder
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
          <IconButton
            sx={{
              p: 0,
              m: 0,
              cursor: 'pointer',
            }}
          >
            <Menu sx={{ fontSize: 24 }} />
          </IconButton>
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
