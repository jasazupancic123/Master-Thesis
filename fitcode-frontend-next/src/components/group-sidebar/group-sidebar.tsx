'use client';

import {
  LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS,
  LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS,
} from '@/common/constant/navigation.constant';
import { useAuth } from '@/store/auth-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { Group } from '@/controller/group/type/group.type';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuIcon from '@mui/icons-material/Menu';
import { Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Logo from '../logo/logo';
import SelectInputHorizontal from '../select-input-horizontal/select-input-horizontal';
import { AppBar, Drawer, DrawerHeader } from './style';
import toast from 'react-hot-toast';

export interface TrainerGroupSidebarProps {
  group: Group | null; // selected group
  groups?: Group[]; // all groups, if needed
}

export default function GroupSidebar(props: TrainerGroupSidebarProps) {
  const { group, groups } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();

  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  function handleLinkClick(
    e: React.MouseEvent,
    states: { group: Group | null }
  ) {
    if (!states.group) {
      e.preventDefault();
      toast.error('Select group first!');
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          transition: 'margin-left 0.3s ease-in-out',
          boxShadow: 'none',
        }}
      >
        <Toolbar
          sx={{
            height: '50px !important',
            minHeight: '50px !important',
            pt: '2px',
            backgroundColor: 'background.default',
          }}
        >
          {/* Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(!open)}
            edge="start"
            sx={{
              marginRight: 2,
              py: 0,
              px: 0,
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          {!screenSize.isMobile && !screenSize.isLandscapeMobile && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                py: 0,
              }}
            >
              <Logo width={52} height={35} version="narrow" />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: !open ? 'none' : undefined,
          zIndex: 1200,
          transition: 'width 0.3s ease-in-out',
          '& .MuiDrawer-paper': {
            mt: -1.6,
            width: '50px',
            transition: 'width 0.3s ease-in-out',
            overflowX: 'hidden',
          },
        }}
      >
        <DrawerHeader>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <IconButton onClick={() => setOpen(false)}>
              {theme.direction === 'rtl' ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
          </Box>
        </DrawerHeader>

        <List
          sx={{
            display: 'flex',
            flexDirection: 'column',
            pt: 0,
            top: 0,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {Object.values(
            LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(group?.id || '')
          ).map((link, i) => (
            <Tooltip title={link.label} placement="right" key={i}>
              <ListItem disablePadding sx={{ display: 'block' }}>
                <Link
                  href={link.href}
                  style={{ width: '100%', textDecoration: 'none' }}
                  onClick={(event) => handleLinkClick(event, { group })}
                >
                  <ListItemButton
                    disableRipple
                    disableTouchRipple
                    sx={[
                      { minHeight: 48, px: 0 },
                      open
                        ? { justifyContent: 'initial' }
                        : { justifyContent: 'center' },
                    ]}
                  >
                    <ListItemIcon
                      sx={[
                        {
                          minWidth: 0,
                          width: '100%',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      {link.icon}
                    </ListItemIcon>
                  </ListItemButton>
                </Link>
              </ListItem>
            </Tooltip>
          ))}
        </List>

        <Divider />

        <List>
          {Object.entries(LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS).map(
            ([key, link], i) => {
              return (
                <Tooltip title={link.label} placement="right" key={i}>
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      sx={[
                        { minHeight: 48, px: 2.5 },
                        open
                          ? { justifyContent: 'initial' }
                          : { justifyContent: 'center' },
                      ]}
                      onClick={() => {
                        if (key === 'signout') logout();
                      }}
                    >
                      <ListItemIcon
                        sx={[
                          {
                            minWidth: 0,
                            width: '100%',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        {link.icon}
                      </ListItemIcon>
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              );
            }
          )}
        </List>
      </Drawer>
    </Box>
  );
}
