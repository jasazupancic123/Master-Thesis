'use client';

import { GroupDateFilter } from '@/common/type/filter.type';
import { SetState } from '@/common/type/state.type';
import FilterButton from '@/components/filter-button/filter-button';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
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
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material';
import {
  KeyboardArrowDownTwoTone,
  KeyboardArrowUpTwoTone,
  Menu,
  Settings,
} from '@mui/icons-material';
import { useState } from 'react';
import {
  LINK_DASHBOARD,
  LINK_PROFILE,
  LINK_SETTINGS,
  LINKS_SIDEBAR,
} from '@/common/constant/navigation.constant';
import Link from 'next/link';
import { useAuth } from '@/store/auth-provider';
import { useRouter } from 'next/navigation';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import ProfileHeaderMenu from '../profile-header-menu/profile-header-menu';

export interface TrainerGroupHeaderProps {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
}

export default function TrainerGroupHeader(props: TrainerGroupHeaderProps) {
  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();

  const { filter, setFilter } = props;

  const { role, profile } = useAuth();
  const { institution, detectedChanges, setDetectedChanges } = useGroup();

  const [open, setOpen] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );

  return (
    <Box
      display="flex"
      mx="auto"
      justifyContent="center"
      width="100%"
      position="relative"
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

                  let Icon: React.ReactNode = null;

                  switch (link.href) {
                    case LINK_DASHBOARD.href:
                      Icon = (
                        <Avatar
                          src={institution.imageUrl}
                          sx={{
                            width: 34,
                            height: 34,
                          }}
                        />
                      );
                      break;
                    case LINK_PROFILE.href:
                      Icon = (
                        <Avatar
                          src={profile?.profileImageUrl}
                          sx={{
                            width: 34,
                            height: 34,
                          }}
                        />
                      );
                      break;
                    case LINK_SETTINGS.href:
                      Icon = <Settings sx={{ fontSize: 20, ml: 0.9 }} />;
                      break;
                    default:
                      Icon = null;
                  }

                  return (
                    <Tooltip title={link.label} placement="right" key={i}>
                      <ListItem disablePadding>
                        <Link href={link.href} passHref>
                          <Box display="flex" alignItems="center" ml={1}>
                            {Icon}
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
            left: screenSize.isDesktop ? 10 : 6,
            top: 10,
          }}
          gap={1}
        >
          <Box
            position="relative"
            onClick={(event) => {
              setAnchorProfileEl(event.currentTarget);
              setOpenProfileMenu(!openProfileMenu);
            }}
          >
            <Avatar
              src={profile?.profileImageUrl}
              sx={{
                width: 34,
                height: 34,
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
          <Link href={LINK_DASHBOARD.href} passHref>
            <Tooltip title="Dashboard">
              <Avatar
                src={institution.imageUrl}
                sx={{
                  width: 34,
                  height: 34,
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          </Link>
          <Tooltip title="Settings">
            <Settings sx={{ fontSize: 20, cursor: 'pointer' }} />
          </Tooltip>
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          maxWidth: MAX_WIDTH,
        }}
      >
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val: GroupDateFilter) => {
            if (detectedChanges) {
              toast.error('Unsaved changes will be lost', {
                icon: '⚠️',
                duration: 2000,
              });

              setDetectedChanges(false);
              return;
            }

            setFilter((prev) => (!val ? prev : val));
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
          {(['day', 'week', 'cycle', 'year'] as GroupDateFilter[]).map(
            (val, index) => (
              <FilterButton key={val} value={val} />
            )
          )}
        </ToggleButtonGroup>
      </Box>
      <ProfileHeaderMenu
        anchorEl={anchorProfileEl}
        open={openProfileMenu}
        setOpen={setOpenProfileMenu}
        setAnchorEl={setAnchorProfileEl}
      />
    </Box>
  );
}
