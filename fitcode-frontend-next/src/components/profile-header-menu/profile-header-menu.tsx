import { LINK_PROFILE } from '@/common/constant/navigation.constant';
import { SetState } from '@/common/type/state.type';
import { useAuth } from '@/store/auth-provider';
import { Logout } from '@mui/icons-material';
import { Menu, MenuItem, Box, Avatar, Typography } from '@mui/material';
import Link from 'next/link';

interface ProfileHeaderMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  setOpen: SetState<boolean>;
  setAnchorEl: SetState<HTMLElement | null>;
}

export default function ProfileHeaderMenu(props: ProfileHeaderMenuProps) {
  const { profile, logout } = useAuth();
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
              src={profile?.profileImageUrl}
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
