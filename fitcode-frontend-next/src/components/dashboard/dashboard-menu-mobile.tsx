import { Logout, Menu as MenuIcon, Settings } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import {
  LINK_PROFILE,
  LINK_SETTINGS,
  LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS,
  LINKS_SIDEBAR_DAHBOARD_VIEW,
} from '@/lib/common/const/nav.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';

export default function DashboardMenuMobile() {
  const { user, role, logout } = useAuthenticatedAuth();

  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{ position: 'absolute', top: 0, right: 14, zIndex: 1300 }}>
        <IconButton
          onClick={() => setOpen(!open)}
          edge="end"
          color="inherit"
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
      </div>

      {/* Side drawer from the right */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <List sx={{ mt: 5 }}>
          {role &&
            [
              ...Object.values(LINKS_SIDEBAR_DAHBOARD_VIEW[role]),
              ...Object.values(LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS),
            ].map((link, i) => {
              if (!link) return null;

              let Icon: React.ReactNode = null;

              switch (link.href) {
                case LINK_PROFILE.href:
                  Icon = (
                    <Avatar
                      src={user?.photoURL || USER_AVATAR_IMG_URL}
                      sx={{
                        width: 25,
                        height: 25,
                      }}
                    />
                  );
                  break;
                case LINK_SETTINGS.href:
                  Icon = <Settings sx={{ fontSize: 25 }} />;
                  break;
                case LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS.signout.href:
                  Icon = <Logout sx={{ fontSize: 25 }} />;
                  break;
                default:
                  Icon = undefined;
              }

              return (
                <Tooltip title={link.label} placement="right" key={i}>
                  <ListItem disablePadding>
                    <Link href={link.href} passHref>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-start"
                        ml={1}
                        onClick={() => {
                          if (
                            link.href ===
                            LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS.signout.href
                          )
                            logout();
                        }}
                      >
                        {Icon}
                        <ListItemText
                          primary={link.label}
                          sx={{
                            py: 1,
                            px: ![
                              LINK_PROFILE.href,
                              LINK_SETTINGS.href,
                              LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS.signout.href,
                            ].includes(link.href)
                              ? 1
                              : 2,
                          }}
                        />
                      </Box>
                    </Link>
                  </ListItem>
                </Tooltip>
              );
            })}
        </List>
      </Drawer>
    </>
  );
}
