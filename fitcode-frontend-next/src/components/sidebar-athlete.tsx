'use client';

import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import Box from '@mui/material/Box';
import * as React from 'react';
import { useState } from 'react';
import Logo from '@/components/logo';
import Typography from '@mui/material/Typography';
import { usePathname, useRouter } from 'next/navigation';
import Stack from '@mui/material/Stack';
import { useAuth } from '@/context/auth-provider';
import IconButton from '@mui/material/IconButton';
import { LogoutRounded } from '@mui/icons-material';
import { UserRole } from '@/controller/user/enum/user-role.enum';

interface Props {
  title?: string;
}

export default function SidebarAthlete(props: Props) {
  const { logout } = useAuth();

  const router = useRouter();
  const path = usePathname();
  const mapper = Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map(
    (link) => link.href
  );

  const [index, setIndex] = useState(() => {
    const index = mapper.findIndex((href) => path === href);
    return index === -1 ? 0 : index;
  });

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        bgcolor="background.default"
        width="100%"
        height={64}
        justifyContent="center"
        alignItems="center"
      >
        <Logo width={80} height={40} />
      </Stack>

      {props.title && (
        <Box
          display="flex"
          justifyContent="center"
          pb={3}
          bgcolor="background.paper"
        >
          <Box bgcolor="background.default" borderRadius="0 0 50px 50px">
            <Typography variant="h5" component="h1" py={1} px={8}>
              {props.title}
            </Typography>
          </Box>
        </Box>
      )}

      <Box
        position="fixed"
        bottom={0}
        width="100%"
        display="flex"
        justifyContent="center"
        zIndex={10001}
      >
        <BottomNavigation
          value={index}
          onChange={(_, newValue) => {
            setIndex(newValue);
            router.push(mapper[newValue]);
          }}
          showLabels
          sx={{
            backgroundColor: '#303E4A',
            height: '70px',
            width: { xs: '100%', md: '50%' }, // Centered and one-third of the width on larger screens
            '& .Mui-selected': { color: '#1EB980 !important' },
          }}
        >
          {Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map((link, i) => (
            <BottomNavigationAction
              key={i}
              label={link.label}
              icon={link.icon || <></>}
              sx={{ color: index === i ? '#1EB980' : '#fff', p: 1 }}
            />
          ))}

          {/* Logout Button */}
          <IconButton onClick={logout}>
            <LogoutRounded />
          </IconButton>
        </BottomNavigation>
      </Box>
    </>
  );
}
