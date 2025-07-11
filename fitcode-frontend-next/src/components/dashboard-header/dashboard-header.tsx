'use client';

import {
  LINK_DASHBOARD,
  LINK_PROFILE,
  LINK_SETTINGS,
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
  LINKS_SIDEBAR,
} from '@/common/constant/navigation.constant';
import { Menu, Save, Settings } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import FilterButton from '../filter-button/filter-button';
import { useDashboard } from '@/store/dashboard-provider';
import { useAuth } from '@/store/auth-provider';
import toast from 'react-hot-toast';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTheme } from '@mui/material';
import { ILink } from '@/common/type/link.type';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DashboardHeader() {
  const {
    filter,
    setFilter,
    selectedInstitution,
    detectedChanges,
    setDetectedChanges,
  } = useDashboard();

  const { role, profile } = useAuth();
  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  return (
    <Box
      width="100%"
      sx={{
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {screenSize.isMobile ? (
        <>
          <div
            style={{
              position: 'fixed',
              top: 3,
              left: 5,
              zIndex: 1300,
            }}
          >
            <IconButton
              onClick={() => setOpen(!open)}
              edge="end"
              color="inherit"
              aria-label="menu"
            >
              <Menu />
            </IconButton>
          </div>

          {/* Side drawer from the right */}
          <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
            <List sx={{ mt: 5 }}>
              {role.length &&
                Object.values(LINKS_SIDEBAR[role[0]]).map((link, i) => {
                  if (!link) return null;

                  return (
                    <Tooltip title={link.label} placement="right" key={i}>
                      <ListItem disablePadding>
                        <Link href={link.href} passHref legacyBehavior>
                          <Box display="flex" alignItems="center" ml={1}>
                            {link.href === LINK_DASHBOARD.href && (
                              <Avatar
                                src={selectedInstitution?.imageUrl || ''}
                                sx={{
                                  width: 34,
                                  height: 34,
                                }}
                              />
                            )}
                            {link.href === LINK_PROFILE.href && (
                              <Avatar
                                src={profile?.profileImageUrl}
                                sx={{
                                  width: 34,
                                  height: 34,
                                }}
                              />
                            )}
                            {link.href === LINK_SETTINGS.href && (
                              <Settings sx={{ fontSize: 20, ml: 0.9 }} />
                            )}
                            <ListItemText
                              primary={link.label}
                              sx={{
                                px: 2,
                                py: 1,
                                ml: link.href === LINK_SETTINGS.href ? 0.9 : 0,
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
      ) : (
        <Box
          display="flex"
          justifyContent="flex-start"
          alignItems="center"
          sx={{
            position: 'absolute',
            left: 15,
            top: 10,
          }}
          gap={1}
        >
          <Link href={LINK_DASHBOARD.href} passHref legacyBehavior>
            <Tooltip title="Dashboard">
              <Avatar
                src={selectedInstitution?.imageUrl || ''}
                sx={{
                  width: 34,
                  height: 34,
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          </Link>

          <Tooltip title="Profile">
            <Avatar
              src={profile?.profileImageUrl}
              sx={{
                width: 34,
                height: 34,
                cursor: 'pointer',
              }}
            />
          </Tooltip>
          <Tooltip title="Settings">
            <Settings sx={{ fontSize: 20, cursor: 'pointer' }} />
          </Tooltip>
        </Box>
      )}
      <Box
        sx={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          mx: 'auto',
        }}
      >
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val: ILink) => {
            if (detectedChanges) {
              toast.error('Unsaved changes will be lost', {
                icon: '⚠️',
                duration: 2000,
              });

              setDetectedChanges(false);
              return;
            }

            setFilter((prev) => (!val ? prev : val));
            router.push(val.href);
          }}
          sx={{
            display: 'flex',
            bgcolor: theme.palette.background.light,
            maxHeight: '38px',
            width: screenSize.isMobile
              ? '66% !important'
              : screenSize.isTablet
                ? '50% !important'
                : '33% !important',
            mx: 'auto',
            mt: '12px',
          }}
        >
          {Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role)).map(
            (val, index) => {
              if (!val) return null;
              return (
                <FilterButton
                  key={val.label}
                  value={val}
                  dashboardView
                  numValues={
                    Object.values(
                      LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role)
                    ).filter((item) => item !== undefined).length
                  }
                />
              );
            }
          )}
        </ToggleButtonGroup>
      </Box>

      <Box
        justifyContent="flex-end"
        alignItems="center"
        sx={{
          position: 'absolute',
          right: screenSize.isSmallerThanLaptop ? 2 : 10,
          top: 10,
          zIndex: 1300,
        }}
      >
        <Tooltip title="Save institution" placement="bottom" sx={{ mx: 1 }}>
          <IconButton
            sx={{ p: 0, m: 0, mx: 1, cursor: 'pointer' }}
            onClick={() => {}}
          >
            <Save fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
