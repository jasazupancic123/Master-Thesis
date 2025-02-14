'use client';

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import GroupsIcon from '@mui/icons-material/Groups';
import { Group } from '@/controller/group/type/group.type';
import { AppBar, Drawer, DrawerHeader } from './style';
import SelectInputHorizontal from '../select-input-horizontal';
import { Props } from './type';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import Logo from '../logo';
import { Tooltip } from '@mui/material';
import {
  LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS,
  LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS,
} from './constant';
import toast from 'react-hot-toast';

export default function TrainerGroupSidebar(props: Props) {
  const screenSize = useScreenSize();
  const { groups, selectedGroup } = props;
  const { logout } = useAuth();

  const theme = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLinkClick = (
    event: React.MouseEvent,
    selectedGroup: Group | null
  ) => {
    if (!selectedGroup) {
      event.preventDefault();
      toast.error('Please select a group first!');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: '100%', // Prevent shifting
          transition: 'margin-left 0.3s ease-in-out',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          {/* Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(!open)}
            edge="start"
            sx={{
              marginRight: 2,
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo - Stay Centered */}
          {!screenSize.isMobile && !screenSize.isLandscapeMobile && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Logo width={52} height={35} version="narrow" />
            </Box>
          )}

          <SelectInputHorizontal<Group>
            label={selectedGroup?.name || 'Select group'}
            icon={<GroupsIcon />}
            value={selectedGroup?.id || ''}
            items={groups}
            itemKey="id"
            itemName="name"
            setValue={(groupId) => {
              const group = groups.find((g) => g.id === groupId);
              if (group)
                router.push(
                  LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(group.id).home.href
                );
            }}
          />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: !open ? 'none' : undefined, // Hide when closed
          position: 'fixed', // Keep it independent
          zIndex: 1200, // Ensure it's above other elements
          transition: 'width 0.3s ease-in-out',
          '& .MuiDrawer-paper': {
            transition: 'width 0.3s ease-in-out',
            overflowX: 'hidden', // Prevent sudden content shift
          },
        }}
      >
        <DrawerHeader>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
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
        <List sx={{ display: 'flex', flexDirection: 'column', pt: 0 }}>
          {Object.values(
            LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(selectedGroup?.id || '')
          ).map((link, i) => (
            <Tooltip title={link.label} placement="right" key={i}>
              <ListItem disablePadding sx={{ display: 'block' }}>
                {/* Wrap the entire ListItemButton in Link */}
                <Link
                  href={link.href}
                  style={{ width: '100%', textDecoration: 'none' }}
                  onClick={(event) => handleLinkClick(event, selectedGroup)}
                >
                  <ListItemButton
                    disableRipple
                    disableTouchRipple
                    sx={[
                      { minHeight: 48, px: 2.5 },
                      open
                        ? { justifyContent: 'initial' }
                        : { justifyContent: 'center' },
                    ]}
                  >
                    <ListItemIcon
                      sx={[
                        { minWidth: 0, justifyContent: 'center' },
                        open ? { mr: 3 } : { mr: 'auto' },
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
                          { minWidth: 0, justifyContent: 'center' },
                          open ? { mr: 3 } : { mr: 'auto' },
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
