'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import GroupsIcon from '@mui/icons-material/Groups';
import SelectInputHorizontal from '@/common/components/select-input-horizontal';
import { Group } from '@/group/entity/group.entity';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SettingsIcon from '@mui/icons-material/Settings';
import { GroupPageSidebarProps } from '@/group/type/sidebar.type';
import { LOCAL_STORAGE_KEYS } from '@/common/constant/local-storage.constant';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/context/auth-provider';
import { AuthContextType } from '../type/context.type';
import { CommonService } from '../service/common.service';
import { ILink } from '../type/link.type';
import { useGroupSidebar } from '@/context/groups-sidebar-provider';
import HomeIcon from '@mui/icons-material/Home';
import toast from 'react-hot-toast';
import { Button } from '@mui/material';
import { LINK_GROUPS } from '../constant/navigation.constant';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}));

const commonService = CommonService.instance;

export default function GroupsSidebar() {
  const { groups, selected, setSelected } = useGroupSidebar();
  const theme = useTheme();
  const router = useRouter();
  const { role, logout } = useAuth() as AuthContextType;
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<ILink[]>([]);
  const [groupChangeCount, setGroupChangeCount] = useState(0);
  const [groupLabel, setGroupLabel] = useState(
    selected.group?.name || 'Select group'
  );
  const sidebarMainItems = [
    'Home',
    'Exercises',
    'Members',
    'Create group',
    'Group Settings',
  ];
  const sidebarSubItems = ['Sign out'];

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleValueChange = (value: string) => {
    const group = groups.data?.find((group) => group.id === value);
    setSelected((prev) => ({
      ...prev,
      group: group || null,
      cycle: null,
      subgroup: null,
    }));
    localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_GROUP_ID, value as string);
    setGroupChangeCount((prev) => prev + 1);
  };

  const getSubItemIcon = (index: number) => {
    switch (index) {
      case 0:
        return <LogoutIcon />;
    }
  };

  const getMainitemIcon = (index: number) => {
    switch (index) {
      case 0:
        return <HomeIcon />;
      case 1:
        return <FitnessCenterIcon />;
      case 2:
        return <PeopleIcon />;
      case 3:
        return <AddIcon />;
      case 4:
        return <SettingsIcon />;
    }
  };

  useEffect(() => {
    if (!groups.data) return;
    setUrls(commonService.navigation.getSidebarLinksByUserRole(role[0]));
    const selectedGroup = localStorage.getItem(
      LOCAL_STORAGE_KEYS.SELECTED_GROUP_ID
    );
    if (selectedGroup) {
      const group = groups.data?.find((group) => group.id === selectedGroup);
      if (group) {
        setSelected((prev) => ({ ...prev, group }));
      }
    }
  }, [groups.data]);

  useEffect(() => {
    if (selected.group && groupChangeCount > 0) {
      router.push(LINK_GROUPS.href + '/' + selected.group.id);
    }
  }, [groupChangeCount]);

  useEffect(() => {
    if (selected.group?.name) {
      setGroupLabel(selected.group.name);
    }

    const refreshGroups = async () => {
      groups.fetch();
    };
    refreshGroups();
  }, [selected.group?.name]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                marginRight: 3,
              },
              open && { display: 'none' },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <SelectInputHorizontal<Group>
            label={groupLabel}
            icon={<GroupsIcon />}
            value={selected.group?.id || ''}
            setValue={(value) => {
              handleValueChange(value as string);
            }}
            items={groups.data || []}
            itemKey="id"
            itemName="name"
          />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ display: 'flex', flexDirection: 'column' }}>
          {sidebarMainItems.map((text, index) => (
            <ListItem
              key={text}
              disablePadding
              sx={{
                display: 'block',
                '&:hover': { backgroundColor: 'transparent' },
                '&:focus': { backgroundColor: 'transparent' },
                '&:active': { backgroundColor: 'transparent' },
              }}
            >
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open
                    ? { justifyContent: 'initial' }
                    : { justifyContent: 'center' },
                ]}
                onClick={() => {
                  console.log(urls);
                  if (urls[index]) {
                    if (urls[index].label === 'Trainings')
                      if (!selected.group) router.push(urls[index].href);
                      else router.push('/groups/' + selected.group?.id);
                    else if (
                      urls[index].label === 'Add Group' ||
                      urls[index].label === 'Exercises'
                    )
                      router.push('/groups/' + urls[index].href);
                    else {
                      if (!selected.group) {
                        toast.error('Please select a group first');
                        return;
                      }
                      router.push(
                        '/groups/' + selected.group?.id + urls[index].href
                      );
                    }
                  } else {
                    console.warn(`No URL defined for index ${index}`);
                  }
                }}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: 'center' },
                    open ? { mr: 3 } : { mr: 'auto' },
                  ]}
                >
                  {getMainitemIcon(index)}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {sidebarSubItems.map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open
                    ? { justifyContent: 'initial' }
                    : { justifyContent: 'center' },
                ]}
                onClick={() => {
                  switch (index) {
                    case 0:
                      logout();
                      break;
                  }
                }}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: 'center' },
                    open ? { mr: 3 } : { mr: 'auto' },
                  ]}
                >
                  {getSubItemIcon(index)}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
