'use client';

import {
  KeyboardArrowDownTwoTone,
  KeyboardArrowUpTwoTone,
  Settings,
} from '@mui/icons-material';
import { Avatar, Box, IconButton, Tooltip } from '@mui/material';
import { useRouter } from 'next/navigation';

import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import useTrainerGroupHeaderUtils from '../trainer-group-header/hooks/use-utils';
import { theme } from '@/app/style';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { LINK_DASHBOARD } from '@/lib/common/const/nav.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import Logo from '@/ui/logo';
import ProfileHeaderMenu from '../profile-header-menu/profile-header-menu';

export default function TrainerTrainingInProgressHeader() {
  const router = useRouter();

  const { user } = useAuthenticatedAuth();

  const {
    anchorProfileEl,
    openProfileMenu,
    setOpenProfileMenu,
    setAnchorProfileEl,
  } = useTrainerGroupHeaderUtils();

  return (
    <Box
      width="100%"
      height="50px"
      maxWidth={MAX_WIDTH}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        right: 0,
        mx: 'auto',
        top: 0,
        px: 2,
      }}
      gap={3}
    >
      <Box
        onClick={() => {
          router.push(LINK_DASHBOARD.href);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <Logo width={101.25} />
      </Box>
      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
        <Box
          position="relative"
          onClick={(event) => {
            setAnchorProfileEl(event.currentTarget);
            setOpenProfileMenu(!openProfileMenu);
          }}
        >
          <Avatar
            src={user?.photoURL || USER_AVATAR_IMG_URL}
            sx={{
              width: 30,
              height: 30,
              cursor: 'pointer',
            }}
          />
          <IconButton
            sx={{
              p: 0,
              m: 0,
              position: 'absolute',
              bottom: -2,
              right: 0,
              backgroundColor: theme.palette.background.dark,
              borderRadius: '50%',
            }}
          >
            {!openProfileMenu ? (
              <KeyboardArrowDownTwoTone
                sx={{
                  fontSize: 15,
                }}
              />
            ) : (
              <KeyboardArrowUpTwoTone
                sx={{
                  fontSize: 15,
                }}
              />
            )}
          </IconButton>
        </Box>
        <Tooltip title="Settings">
          <Settings sx={{ fontSize: 20, cursor: 'pointer' }} />
        </Tooltip>
      </Box>

      {/* Profile dropdown menu*/}
      <ProfileHeaderMenu
        anchorEl={anchorProfileEl}
        open={openProfileMenu}
        setOpen={setOpenProfileMenu}
        setAnchorEl={setAnchorProfileEl}
      />
    </Box>
  );
}
