'use client';

import { Done, Menu as MenuIcon, Pause } from '@mui/icons-material';
import {
  Avatar,
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
import dayjs from 'dayjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

import type { ITrainingInProgressUtilsCtx } from '../training-in-progress/context/training-in.progress-utils.provider';
import type { IUndoneExercisesCtx } from '../training-in-progress/context/undone-exercises.provider';
import BottomNavigation from './bottom-navigation';
import CreateTrainingModal from './create-training-modal';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { TrainingService } from '@/core/training/training.service';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { LINKS_SIDEBAR_GROUP_VIEW } from '@/lib/common/const/nav.const';
import { useAthlete } from '@/store/athlete.provider';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import Logo from '@/ui/logo';

interface Props {
  trainingInProgressUndoneExercisesContext?: IUndoneExercisesCtx;
  trainingInProgressContext?: ITrainingInProgressContext;
  trainingInProgressUtilsContext?: ITrainingInProgressUtilsCtx;
}

export default function AthleteHeader(props: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const pathname = usePathname();

  const { user, role, logout } = useAuthenticatedAuth();
  const { exercises, setTrainings } = useMain();
  const { filter, setFilter } = useAthlete() || {};
  const { selectedTrackingMethod } = useAthleteHeader() || {};
  const trainingContext = useTrainings();
  const { trainingInProgress } = trainingContext || {};

  const {
    trainingInProgressUndoneExercisesContext,
    trainingInProgressContext,
    trainingInProgressUtilsContext,
  } = props;

  const {
    anchorEl,
    open: openTrainingControls,
    edit,
    handleCancel,
    handleFinish,
    handleEdit,
    handleOpenMenu,
    handleCloseMenu,
  } = trainingInProgressUtilsContext || {};

  const isInTrainingInProgress = pathname.includes('/components');

  const [open, setOpen] = useState(false);
  const [openCreateTrainingModal, setOpenCreateTrainingModal] = useState(false);

  const toggle = (newOpen: boolean) => () => setOpen(newOpen);

  const mobileDisplay = screenSize.isMobile || screenSize.isLandscapeMobile;

  const DrawerList = role && (
    <Box sx={{ width: 140 }} role="presentation" onClick={toggle(false)}>
      <List sx={{ pt: 0 }}>
        {(!mobileDisplay
          ? lib.common.nav.getSidebarLinksByUserRole(role) // for desktop, use all links
          : []
        ).map(({ href, label }, i) => (
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

        {/* <ListItem disablePadding>
          <ListItemButton
            sx={{ width: '100%' }}
            onClick={() => {
              setOpenCreateTrainingModal(true);
            }}
          >
            <ListItemText primary="Add training" />
          </ListItemButton>
        </ListItem> */}

        {trainingInProgress &&
          trainingInProgressUndoneExercisesContext &&
          trainingInProgressUtilsContext &&
          openTrainingControls !== undefined &&
          trainingInProgressContext && (
            <>
              <ListItem
                onClick={handleFinish}
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
                  color: 'warning.main',
                  cursor: 'pointer',
                }}
              >
                <Pause sx={{ marginRight: 1 }} />
                Pause Training
              </ListItem>
              {/* <ListItem
                onClick={handleEdit}
                sx={{
                  cursor: 'pointer',
                }}
              >
                <Edit sx={{ marginRight: 1 }} />
                {edit ? 'Disable' : 'Enable'} Editing
              </ListItem> */}
            </>
          )}
      </List>

      {/* <Divider /> */}

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
            px: mobileDisplay ? 2.5 : 6,
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

          {isInTrainingInProgress ? (
            <></>
          ) : (
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
          )}

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
                    <MenuItem onClick={handleFinish}>
                      <>
                        <Done sx={{ marginRight: 1 }} />
                        Finish Training
                      </>
                    </MenuItem>

                    <MenuItem
                      onClick={handleCancel}
                      sx={{ color: 'warning.main' }}
                    >
                      <Pause sx={{ marginRight: 1 }} />
                      Pause Training
                    </MenuItem>
                    {/* <MenuItem
                      onClick={handleEdit}
                      sx={{
                        cursor: 'pointer',
                      }}
                    >
                      <Edit sx={{ marginRight: 1 }} />
                      {edit ? 'Disable' : 'Enable'} Editing
                    </MenuItem> */}
                  </Menu>
                </>
              )}
          </>
          <Drawer open={open} onClose={toggle(false)} anchor="right">
            {DrawerList}
          </Drawer>
        </Box>

        {mobileDisplay && !isInTrainingInProgress && (
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

      <CreateTrainingModal
        open={openCreateTrainingModal}
        setOpen={setOpenCreateTrainingModal}
        onCreateTraining={(training) => {
          training = TrainingService.mapTraining(training, { exercises });
          setTrainings((prev) => ({
            ...prev,
            data: [...prev.data, training].sort((a, b) =>
              dayjs(a.from).diff(dayjs(b.from))
            ),
          }));
        }}
      />
    </>
  );
}
