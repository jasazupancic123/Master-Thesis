'use client';

import {
  CopyAllOutlined,
  KeyboardArrowDownTwoTone,
  KeyboardArrowUpTwoTone,
  Logout,
  Menu,
  SaveOutlined,
  Settings,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
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
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import LoadingOverlay from '../../ui/loading-overlay';
import Logo from '../../ui/logo';
import ProfileHeaderMenu from '../profile-header-menu/profile-header-menu';
import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { handleUpdateTraining } from './actions/actions-training';
import AddMemberModal from './add-member-modal';
import useTrainerGroupHeaderUtils from './hooks/use-utils';
import { InstitutionController } from '@/core/institution/institution.controller';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import {
  LINK_DASHBOARD,
  LINK_PROFILE,
  LINK_SETTINGS,
  LINK_SIGN_OUT,
  LINKS_SIDEBAR_GROUP_VIEW,
} from '@/lib/common/const/nav.const';
import type { GroupDateFilter } from '@/lib/common/type/filter.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import FilterButton from '@/ui/filter-button';

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

  const mainContext = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();

  const { institution } = mainContext;

  const {
    setGroup,
    selectedGroup,
    setSelectedGroup,
    cycle,
    setCycle,
    detectedChanges,
    setDetectedChanges,
  } = groupContext;

  const {
    isUpdatingTraining,
    setIsUpdatingTraining,
    openDrawer,
    setOpenDrawer,
    openProfileMenu,
    setOpenProfileMenu,
    addMemberModal,
    setAddMemberModal,
    anchorProfileEl,
    setAnchorProfileEl,
  } = useTrainerGroupHeaderUtils();

  async function handleSaveGroup() {
    for (const cycle of selectedGroup.cycles) {
      if (cycle.from >= cycle.to) {
        toast.error('Start date must be before end date.');
        return;
      }
    }

    try {
      const group = await InstitutionController.getInstance().updateGroup(
        selectedGroup.institutionId,
        selectedGroup.id,
        {
          shortName: selectedGroup.shortName,
          cycles: selectedGroup.cycles,
        }
      );

      if (group.cycles.length === 1) setCycle(group.cycles[0]);
      else if (cycle) {
        group.cycles.forEach((groupCycle) => {
          if (groupCycle.id === cycle.id) setCycle(groupCycle);
        });
      }

      setGroup(group);
      setSelectedGroup(group);
      setDetectedChanges(false);

      toast.success('Group successfully saved');
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to save group');
    }
  }

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
              onClick={() => setOpenDrawer(!openDrawer)}
              edge="end"
              color="inherit"
              aria-label="menu"
            >
              <Menu />
            </IconButton>
          </div>

          {/* Mobile side drawer from the left */}
          <Drawer
            anchor="left"
            open={openDrawer}
            onClose={() => setOpenDrawer(false)}
          >
            <List sx={{ mt: 5 }}>
              {auth.role &&
                Object.values(LINKS_SIDEBAR_GROUP_VIEW[auth.role]).map(
                  (link, i) => {
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
                            src={auth.user?.photoURL || USER_AVATAR_IMG_URL}
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
                                  ml:
                                    link.href === LINK_SETTINGS.href ? 0.9 : 0,
                                }}
                              />
                            </Box>
                          </Link>
                        </ListItem>
                      </Tooltip>
                    );
                  }
                )}
              <Tooltip title={LINK_SIGN_OUT.label} placement="right">
                <ListItem sx={{ px: 1.5 }}>
                  <Link href={LINK_SIGN_OUT.href} passHref>
                    <Box
                      display="flex"
                      alignItems="center"
                      ml={0.7}
                      onClick={() => auth.logout()}
                    >
                      <Logout sx={{ fontSize: 20 }} />
                      <ListItemText
                        primary={LINK_SIGN_OUT.label}
                        sx={{
                          px: 2,
                          ml: 0.6,
                        }}
                      />
                    </Box>
                  </Link>
                </ListItem>
              </Tooltip>
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
          <Box
            onClick={() => {
              router.push(LINK_DASHBOARD.href);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Logo width={101.25} />
          </Box>
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
                        onClick={async () => {
                          await handleUpdateTraining(
                            setIsUpdatingTraining,
                            mainContext,
                            groupContext,
                            trainerDayViewContext
                          );
                        }}
                      >
                        <SaveOutlined sx={{ fontSize: 22 }} />
                      </IconButton>
                    </Tooltip>

                    <IconButton>
                      <CopyAllOutlined sx={{ fontSize: 22 }} />
                    </IconButton>

                    <IconButton onClick={() => setAddMemberModal(true)}>
                      <AddIcon fontSize="medium" />
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
                        onClick={handleSaveGroup}
                      >
                        <SaveOutlined />
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
                  src={auth.user?.photoURL || USER_AVATAR_IMG_URL}
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
                <Tooltip title="Add member">
                  <IconButton onClick={() => setAddMemberModal(true)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <IconButton
                  sx={{ p: 0, m: 0 }}
                  onClick={async () => {
                    await handleUpdateTraining(
                      setIsUpdatingTraining,
                      mainContext,
                      groupContext,
                      trainerDayViewContext
                    );
                  }}
                >
                  <SaveOutlined
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
            </Box>
          )}

          {filter === 'year' && (
            <IconButton
              onClick={handleSaveGroup}
              sx={{
                p: 0,
                ml: 2,
                position: 'fixed',
                bottom: 20,
                right: 20,
              }}
            >
              <SaveOutlined
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
          {(['day', 'week', 'phase', 'year'] as GroupDateFilter[]).map(
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
        <LoadingOverlay title="Updating training plan..." showLogos />
      )}

      <AddMemberModal open={addMemberModal} setOpen={setAddMemberModal} />
    </Box>
  );
}
