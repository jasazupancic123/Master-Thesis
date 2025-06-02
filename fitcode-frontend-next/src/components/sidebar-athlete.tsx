'use client';

import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import Logo from '@/components/logo';
import { useScreenSize } from '@/context/screen-size-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import Box from '@mui/material/Box';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import BottomNavigation from './bottom-navigation';
import Sidebar from './sidebar';
import { Avatar, Tooltip } from '@mui/material';
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useRouter } from 'next/navigation';
import { useAthlete } from '@/context/athlete-provider';
import { useAuth } from '@/context/auth-provider';

export default function SidebarAthlete() {
  const { selectedDate, setSelectedDate } = useAthlete();

  const screenSize = useScreenSize();
  const router = useRouter();
  const path = usePathname();
  const { profile, user } = useAuth();
  const mapper = Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map(
    (link) => link.href
  );
  mapper.push('#'); //logout

  const [index, setIndex] = useState(() => {
    const index = mapper.findIndex((href) => path === href);
    return index === -1 ? 0 : index;
  });

  const [avatarSrc, setAvatarSrc] = useState(profile?.profileImageUrl);

  useEffect(() => {
    setAvatarSrc(profile?.profileImageUrl);
  }, [profile]);

  return (
    <>
      <Box
        display="flex"
        bgcolor="background.default"
        width="100%"
        height={80}
        justifyContent="space-between"
        px={screenSize.isMobile ? 2 : screenSize.isSmallerThanLaptop ? 5 : 10}
        position="relative"
        alignItems="center"
      >
        <Box
          sx={{ p: 0, m: 0, cursor: 'pointer' }}
          onClick={() => router.push('/trainings')}
        >
          <Logo width={52} height={35} version="narrow" />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Tooltip title={user?.email}>
            <Avatar
              className="avatar-border"
              src={avatarSrc || '/user_avatar.png'} // Path to the image in the public folder
              sx={{
                width: 70,
                height: 70,
                mx: 0,
                my: 1,
              }}
            />
          </Tooltip>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs as any}>
          <MobileDatePicker
            value={selectedDate}
            onChange={(newDate) => {
              if (!newDate) return;
              setSelectedDate(newDate);
            }}
            format="DD-MMM-YY"
            closeOnSelect={true}
            slotProps={{
              textField: {
                variant: 'standard',
                InputProps: {
                  disableUnderline: true,
                  sx: {
                    userSelect: 'none',
                    border: 'none !important',
                    backgroundColor: 'transparent !important',
                    color: 'white',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    display: 'inline-flex', // ✅ Ensures it only takes necessary space
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 'auto', // ✅ Prevents extra width
                    padding: 0,
                    margin: 0,
                    fontSize: 15,
                  },
                },
                sx: {
                  '& .MuiInputBase-input': {
                    cursor: 'pointer !important',
                    WebkitUserSelect: 'none !important' /* Safari */,
                    msUserSelect: 'none !important' /* IE 10 and IE 11 */,
                    userSelect: 'none !important' /* Standard syntax */,
                  },
                  userSelect: 'none !important',
                  cursor: 'pointer',
                  width: 80,
                  padding: 0,
                  margin: 0,
                  border: 'none !important',
                  backgroundColor: 'transparent !important',
                  '& .react-datetime-picker__wrapper': {
                    border: 'none !important',
                  },
                },
                inputProps: {
                  style: {
                    userSelect: 'none',
                    border: 'none !important',
                    backgroundColor: 'transparent !important',
                    padding: '0px',
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
      </Box>

      <Box
        position="fixed"
        bottom={0}
        width="100%"
        display="flex"
        justifyContent="center"
        zIndex={10001}
      >
        {!screenSize.isLandscapeMobile && !screenSize.isMobile ? (
          <Sidebar />
        ) : (
          <BottomNavigation index={index} setIndex={setIndex} mapper={mapper} />
        )}
      </Box>
    </>
  );
}
