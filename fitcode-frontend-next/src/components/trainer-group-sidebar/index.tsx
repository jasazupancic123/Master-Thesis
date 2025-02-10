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
import ListItemText from '@mui/material/ListItemText';
import GroupsIcon from '@mui/icons-material/Groups';
import { Group } from '@/controller/group/type/group.type';
import { AppBar, Drawer, DrawerHeader } from './style';
import SelectInputHorizontal from '../select-input-horizontal';
import { Props } from './type';
import {
  LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS,
  LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS,
} from './constant';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrainerGroupSidebar(props: Props) {
  const { logout, groups, selectedGroup } = props;

  const theme = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(true)}
            edge="start"
            sx={[{ marginRight: 3 }, open && { display: 'none' }]}
          >
            <MenuIcon />
          </IconButton>

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

      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            {theme.direction === 'rtl' ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>

        <Divider />

        {selectedGroup && (
          <List sx={{ display: 'flex', flexDirection: 'column' }}>
            {Object.values(
              LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(selectedGroup.id)
            ).map((link, i) => (
              <ListItem
                key={i}
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
                >
                  <ListItemIcon
                    sx={[
                      { minWidth: 0, justifyContent: 'center' },
                      open ? { mr: 3 } : { mr: 'auto' },
                    ]}
                  >
                    <Link href={link.href}>{link.icon}</Link>
                  </ListItemIcon>

                  <ListItemText
                    primary={<Link href={link.href}>{link.label}</Link>}
                    sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        <Divider />

        <List>
          {Object.entries(LINKS_TRAINER_GROUP_SIDEBAR_SUB_ITEMS).map(
            ([key, link], i) => {
              return (
                <ListItem key={i} disablePadding sx={{ display: 'block' }}>
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

                    <ListItemText
                      primary={link.label}
                      sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                    />
                  </ListItemButton>
                </ListItem>
              );
            }
          )}
        </List>
      </Drawer>
    </Box>
  );
}
