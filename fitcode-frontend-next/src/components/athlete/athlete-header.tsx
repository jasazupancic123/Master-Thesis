'use client';

import { Close, Done, Menu as MenuIcon } from '@mui/icons-material';
import {
  Avatar,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import Box from '@mui/material/Box';
import Link from 'next/link';
import * as React from 'react';
import { useState } from 'react';

import { handleFinishSuperset } from '../training-in-progress/actions/actions-superset';
import type { ITrainingInProgressUtilsCtx } from '../training-in-progress/context/training-in.progress-utils.provider';
import type { IUndoneExercisesCtx } from '../training-in-progress/context/undone-exercises.provider';
import BottomNavigation from './bottom-navigation';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { LINKS_SIDEBAR_GROUP_VIEW } from '@/lib/common/const/nav.const';
import { useAthlete } from '@/store/athlete.provider';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTraining } from '@/store/training.provider';
import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';
import Logo from '@/ui/logo';

interface Props {
  trainingInProgressUndoneExercisesContext?: IUndoneExercisesCtx;
  trainingInProgressContext?: ITrainingInProgressContext;
  trainingInProgressUtilsContext?: ITrainingInProgressUtilsCtx;
}

export default function AthleteHeader(props: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { user, role, logout } = useAuthenticatedAuth();
  const { filter, setFilter } = useAthlete() || {};

  const { selectedTrackingMethod } = useAthleteHeader() || {};

  const trainingContext = useTraining();

  const { trainingInProgress } = trainingContext || {};

  const {
    trainingInProgressUndoneExercisesContext,
    trainingInProgressContext,
    trainingInProgressUtilsContext,
  } = props;

  const {
    anchorEl,
    open: openTrainingControls,
    handleCancel,
    handleOpenMenu,
    handleCloseMenu,
  } = trainingInProgressUtilsContext || {};

  const [open, setOpen] = useState(false);

  const toggle = (newOpen: boolean) => () => setOpen(newOpen);

  const DrawerList = role && (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggle(false)}>
      <List sx={{ pt: 0 }}>
        <ListItem>
          {/* This provides the gap from the top of the screen */}
          <ListItemButton>
            <ListItemText />
          </ListItemButton>
        </ListItem>

        {lib.common.nav
          .getSidebarLinksByUserRole(role)
          .map(({ href, label }, i) => (
            <ListItem key={i} disablePadding>
              <Link
                href={href}
                passHref
                style={{ width: '100%' }}
                onClick={() => {
                  if (!filter || !setFilter) return;

                  const newValue = Object.values(
                    LINKS_SIDEBAR_GROUP_VIEW[UserRole.ATHLETE]
                  )[i];
                  if (!newValue) return;

                  setFilter(newValue);
                }}
              >
                <ListItemButton sx={{ width: '100%' }}>
                  <ListItemText primary={label} />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}

        {trainingInProgress &&
          trainingInProgressUndoneExercisesContext &&
          trainingInProgressUtilsContext &&
          openTrainingControls !== undefined &&
          trainingInProgressContext && (
            <>
              <ListItem
                onClick={async () =>
                  await handleFinishSuperset({
                    useTraining: {
                      ...trainingContext,
                      trainingInProgress,
                    },
                    useUndoneExercises:
                      trainingInProgressUndoneExercisesContext,
                    useTrainingInProgress: trainingInProgressContext,
                    useTrainingInProgressUtils: trainingInProgressUtilsContext,
                  })
                }
                sx={{
                  cursor: 'pointer',
                }}
              >
                <>
                  <Done sx={{ marginRight: 1 }} />
                  Finish Training
                </>
              </ListItem>
              <ListItem
                onClick={handleCancel}
                sx={{
                  color: 'error.main',
                  cursor: 'pointer',
                }}
              >
                <Close sx={{ marginRight: 1 }} />
                Cancel Training
              </ListItem>
            </>
          )}
      </List>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Sign Out" onClick={() => logout()} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  if (selectedTrackingMethod === TrackingMethod.CAMERA) return null;

  return (
    <>
      <Box
        display="flex"
        width="100%"
        height={47}
        maxWidth={MAX_WIDTH}
        sx={{
          backgroundColor: theme.palette.background.default,
          justifyContent: 'space-between',
          position: 'relative',
          alignItems: 'center',
          mx: 'auto',
        }}
      >
        <Box
          sx={{
            px: screenSize.isMobile ? 2.5 : 6,
          }}
        >
          <Logo width={100} />
        </Box>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          gap={1}
          sx={{ px: 1 }}
        >
          <Avatar
            src={user?.photoURL || USER_AVATAR_IMG_URL}
            sx={{ width: 32, height: 32 }}
          />

          {!screenSize.isLandscapeMobile && !screenSize.isMobile ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={toggle(!open)}
            >
              <Tooltip title="Menu">
                <MenuIcon />
              </Tooltip>
            </Box>
          ) : (
            <>
              {trainingInProgress &&
                trainingInProgressUndoneExercisesContext &&
                trainingInProgressUtilsContext &&
                openTrainingControls !== undefined &&
                trainingInProgressContext && (
                  <>
                    <IconButton sx={{ p: 0, m: 0 }} onClick={handleOpenMenu}>
                      <MenuIcon style={{ cursor: 'pointer' }} />
                    </IconButton>

                    <Menu
                      anchorEl={anchorEl}
                      open={openTrainingControls}
                      onClose={handleCloseMenu}
                      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                      transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                      }}
                      PaperProps={{ sx: { mb: 1 } }}
                    >
                      <MenuItem
                        onClick={async () =>
                          await handleFinishSuperset({
                            useTraining: {
                              ...trainingContext,
                              trainingInProgress,
                            },
                            useUndoneExercises:
                              trainingInProgressUndoneExercisesContext,
                            useTrainingInProgress: trainingInProgressContext,
                            useTrainingInProgressUtils:
                              trainingInProgressUtilsContext,
                          })
                        }
                      >
                        <>
                          <Done sx={{ marginRight: 1 }} />
                          Finish Training
                        </>
                      </MenuItem>

                      <MenuItem
                        onClick={handleCancel}
                        sx={{ color: 'error.main' }}
                      >
                        <Close sx={{ marginRight: 1 }} />
                        Cancel Training
                      </MenuItem>
                    </Menu>
                  </>
                )}
            </>
          )}

          {!screenSize.isLandscapeMobile && !screenSize.isMobile && (
            <Drawer open={open} onClose={toggle(false)} anchor="right">
              {DrawerList}
            </Drawer>
          )}
        </Box>

        {(screenSize.isLandscapeMobile || screenSize.isMobile) &&
          !trainingInProgress && (
            <Box
              position="fixed"
              bottom={0}
              width="100%"
              display="flex"
              justifyContent="center"
              zIndex={1000}
            >
              <BottomNavigation />
            </Box>
          )}
      </Box>
    </>
  );
}
