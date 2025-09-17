import { Logout } from '@mui/icons-material';
import { Avatar, Box, Menu, MenuItem, Typography } from '@mui/material';
import Link from 'next/link';

import { LINK_PROFILE } from '@/common/constant/navigation.constant';
import type { SetState } from '@/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';

interface ProfileHeaderMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  setOpen: SetState<boolean>;
  setAnchorEl: SetState<HTMLElement | null>;
}

export default function ProfileHeaderMenu(props: ProfileHeaderMenuProps) {
  const { user, logout } = useAuthenticatedAuth();
  const { anchorEl, open, setOpen, setAnchorEl } = props;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={() => {
        setOpen(false);
        setAnchorEl(null);
      }}
      sx={{
        left: -10,
      }}
    >
      <MenuItem sx={{ px: 1 }}>
        <Link href={LINK_PROFILE.href} passHref>
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            gap={1}
          >
            <Avatar
              src={user?.photoURL || '/user_avatar.png'}
              sx={{
                width: 25,
                height: 25,
              }}
            />
            <Typography>Profile</Typography>
          </Box>
        </Link>
      </MenuItem>
      <MenuItem sx={{ px: 1.5 }}>
        <Box onClick={() => logout()}>
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            gap={1}
          >
            <Logout sx={{ fontSize: 20 }} />
            <Typography>Sign Out</Typography>
          </Box>
        </Box>
      </MenuItem>
    </Menu>
  );
}
