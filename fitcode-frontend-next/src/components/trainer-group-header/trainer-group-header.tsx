'use client';

import {
  CopyAll,
  CopyAllOutlined,
  KeyboardArrowDownTwoTone,
  KeyboardArrowUpTwoTone,
  Menu,
  Save,
  SaveOutlined,
  Settings,
} from '@mui/icons-material';
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
import { useTheme } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

import ProfileHeaderMenu from '../profile-header-menu/profile-header-menu';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import {
  LINK_DASHBOARD,
  LINK_PROFILE,
  LINK_SETTINGS,
  LINKS_SIDEBAR,
} from '@/common/constant/navigation.constant';
import type { GroupDateFilter } from '@/common/type/filter.type';
import type { SetState } from '@/common/type/state.type';
import FilterButton from '@/components/filter-button/filter-button';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import Logo from '../logo/logo';
import { handleUpdateMultipleTrainings } from '../trainer-group-day-view/state';
import { TrainingController } from '@/controller/training/training.controller';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { useRouter } from 'next/navigation';
import LoadingOverlay from '../loading-overlay/loading-overlay';
import { handleSaveGroup } from '@/app/(trainer)/groups/[group_id]/state';
import { GroupController } from '@/controller/group/group.controller';

export interface TrainerGroupHeaderProps {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
}

export default function TrainerGroupHeader(props: TrainerGroupHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const { filter, setFilter } = props;

  const auth = useAuthenticatedAuth();
  const trainingController = TrainingController.getInstance(auth.token);
  const groupController = GroupController.getInstance(auth.token);

  const {
    group,
    setGroup,
    cycle,
    setCycle,
    setTrainings,
    institution,
    detectedChanges,
    setDetectedChanges,
  } = useGroup();

  const { components, exercises, methods } = useMain();

  const trainerDayViewContext = useTrainerDayViewContext();

  const { training, setTraining, selectedAthlete, isSettingAthleteWorkloads } =
    trainerDayViewContext || {};

  const [isUpdatingTraining, setIsUpdatingTraining] = useState(false);
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
      maxWidth={MAX_WIDTH}
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

          {/* Mobile side drawer from the left */}
          <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
            <List sx={{ mt: 5 }}>
              {auth.role &&
                Object.values(LINKS_SIDEBAR[auth.role]).map((link, i) => {
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
                          src={auth.user?.photoURL || '/user_avatar.png'}
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
          width="100%"
          height="50px"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            px: 2,
          }}
          gap={3}
        >
          <Logo height={15} width={101.25} />
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            gap={4}
          >
            {filter === 'day' && (
              <>
                {!screenSize.isSmallerThanLaptop && (
                  <Box
                    height={50}
                    display="flex"
                    alignItems="center"
                    sx={{
                      backgroundColor: theme.palette.background.light,
                      px: 1,
                      borderBottomLeftRadius: '10%',
                      borderBottomRightRadius: '10%',
                    }}
                    gap={1}
                  >
                    <Tooltip title="Save training" placement="bottom">
                      <IconButton
                        sx={{ mx: 0, cursor: 'pointer' }}
                        onClick={() =>
                          handleUpdateMultipleTrainings(trainingController, {
                            setTrainings,
                            training,
                            setTraining,
                            group,
                            cycle,
                            router,
                            components,
                            exercises,
                            methods,
                            setDetectedChanges,
                            selectedAthlete,
                            isSettingAthleteWorkloads,
                            setIsUpdatingTraining,
                          })
                        }
                      >
                        <SaveOutlined
                          sx={{
                            fontSize: 22,
                          }}
                        />
                      </IconButton>
                    </Tooltip>

                    <IconButton>
                      <CopyAllOutlined
                        sx={{
                          fontSize: 22,
                        }}
                      />
                    </IconButton>
                  </Box>
                )}
              </>
            )}

            {filter === 'year' && (
              <>
                {!screenSize.isSmallerThanLaptop && (
                  <Box
                    height={50}
                    display="flex"
                    alignItems="center"
                    sx={{
                      backgroundColor: theme.palette.background.light,
                      px: 1,
                      borderBottomLeftRadius: '10%',
                      borderBottomRightRadius: '10%',
                    }}
                    gap={1}
                  >
                    <Tooltip
                      title="Save group"
                      placement="bottom"
                      sx={{ mx: 1 }}
                    >
                      <IconButton
                        sx={{ p: 0, m: 0, mx: 1, cursor: 'pointer' }}
                        onClick={() =>
                          handleSaveGroup(
                            groupController,
                            group,
                            setGroup,
                            cycle,
                            setCycle,
                            setDetectedChanges,
                            router,
                            setGroup
                          )
                        }
                      >
                        <Save fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </>
            )}

            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
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
                  src={auth.user?.photoURL || '/user_avatar.png'}
                  sx={{
                    width: 30,
                    height: 30,
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
                      width: 30,
                      height: 30,
                      cursor: 'pointer',
                    }}
                  />
                </Tooltip>
              </Link>
              <Tooltip title="Settings">
                <Settings sx={{ fontSize: 20, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {screenSize.isSmallerThanLaptop && (
        <>
          {filter === 'day' && (
            <Box
              justifyContent="flex-end"
              alignItems="center"
              sx={{
                position: 'absolute',
                right: screenSize.isSmallerThanLaptop ? 6 : 10,
                top: screenSize.isSmallerThanLaptop ? -38 : -43,
                zIndex: 1300,
              }}
            >
              <Box
                display="flex"
                sx={{
                  p: 0,
                  ml: 2,
                  position: 'fixed',
                  bottom: 20,
                  right: 20,
                  zIndex: 1000,
                }}
              >
                <IconButton
                  sx={{
                    p: 0,
                    m: 0,
                  }}
                  onClick={() => {
                    handleUpdateMultipleTrainings(trainingController, {
                      setTrainings,
                      training,
                      setTraining,
                      group,
                      cycle,
                      router,
                      components,
                      exercises,
                      methods,
                      setDetectedChanges,
                      selectedAthlete,
                      isSettingAthleteWorkloads,
                      setIsUpdatingTraining,
                    });
                  }}
                >
                  <Save
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: '50%',
                      p: 1,
                      fontSize: 40,
                      color: theme.palette.text.secondary,
                    }}
                  />
                </IconButton>
              </Box>

              <IconButton
                sx={{
                  mx: 0,
                  m: screenSize.isSmallerThanLaptop ? 0 : undefined,
                  p: screenSize.isSmallerThanLaptop ? 0 : undefined,
                  cursor: 'pointer',
                }}
              >
                <CopyAll fontSize="small" />
              </IconButton>
            </Box>
          )}

          {filter === 'year' && (
            <IconButton
              onClick={() =>
                handleSaveGroup(
                  groupController,
                  group,
                  setGroup,
                  cycle,
                  setCycle,
                  setDetectedChanges,
                  router,
                  setGroup
                )
              }
              sx={{
                p: 0,
                ml: 2,
                position: 'fixed',
                bottom: 20,
                right: 20,
              }}
            >
              <Save
                sx={{
                  mr: 0,
                  cursor: 'pointer',
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '50%',
                  p: 1,
                  fontSize: 40,
                  color: theme.palette.text.secondary,
                }}
              />
            </IconButton>
          )}
        </>
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
            alignItems: 'center',
            height: '50px',
            justifyContent: 'center',
            gap: 4,
            width:
              screenSize.isMobile || screenSize.isTablet
                ? '50% !important'
                : '33% !important',
            mx: 'auto',
          }}
        >
          {(['day', 'week', 'month', 'year'] as GroupDateFilter[]).map(
            (val) => (
              <FilterButton key={val} value={val} />
            )
          )}
        </ToggleButtonGroup>
      </Box>
      {/* Profile dropdown menu*/}
      <ProfileHeaderMenu
        anchorEl={anchorProfileEl}
        open={openProfileMenu}
        setOpen={setOpenProfileMenu}
        setAnchorEl={setAnchorProfileEl}
      />
      {isUpdatingTraining && (
        <LoadingOverlay title="Updating training plan..." />
      )}
    </Box>
  );
}
