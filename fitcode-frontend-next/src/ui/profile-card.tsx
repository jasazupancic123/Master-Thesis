import { MoreVert } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';

import type { ProfileHeaderMenuProps } from '@/components/profile-header-menu/profile-header-menu';
import ProfileHeaderMenu from '@/components/profile-header-menu/profile-header-menu';
import { DASHBOARD_SIDEBAR_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';

export default function ProfileCard(props: ProfileHeaderMenuProps) {
  const { user } = useAuthenticatedAuth();

  const { setOpen: setOpenProfileMenu, setAnchorEl: setAnchorProfileEl } =
    props;

  return (
    <>
      <Box
        width="100%"
        maxWidth={DASHBOARD_SIDEBAR_WIDTH}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          px: 1,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            p: 1,
            px: 0.5,
          }}
          gap={0.5}
        >
          <Avatar
            src={user.photoURL || USER_AVATAR_IMG_URL}
            sx={{
              width: 30,
              height: 30,
              cursor: 'pointer',
            }}
          />
          <Box
            maxWidth={120}
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Typography
              fontSize={12}
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.displayName}
            </Typography>
            <Typography
              fontSize={10}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={(event) => {
            setAnchorProfileEl(event.currentTarget);
            setOpenProfileMenu((prev) => !prev);
          }}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            p: 0,
            m: 0,
            mt: 0.5,
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Box>

      <ProfileHeaderMenu {...props} />
    </>
  );
}
