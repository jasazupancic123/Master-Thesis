'use client';

import { ArrowDropDown, FileUploadOutlined, Remove } from '@mui/icons-material';
import {
  Avatar,
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Menu,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { useDashboardUserEdit } from '../dashboard/context/user-edit.context';
import DashboardPageContainer from '../dashboard/dashboard-page-container';
import useInstitutionMembers from '../dashboard/hooks/use-institution-members.hook';
import AddGroupModal from '../dashboard/modals/add-group-modal';
import EditAthleteModal from '../dashboard/modals/edit-athlete-modal';
import { MAX_WIDTH_DASHBOARD_ITEM } from '../trainer-group-day-view/constant/dimensions.constant';
import DashboardGroupCard from './dashboard-group-card';
import { FilterMembersBy } from './enum/filter-members-by.enum';
import useCsvMembersUpload from './hooks/use-csv-members-upload.hook';
import useDashboardMembers from './hooks/use-members.hook';
import RegisterUsersDashboardModal from './modals/dashboard-register-users.modal';
import { theme } from '@/app/style';
import { UserRole } from '@/core/user/enum/user-role.enum';
import type { User } from '@/core/user/type/user.type';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { InputType } from '@/lib/common/const/input-type.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';
import DeleteGroupModal from '../dashboard/modals/delete-group-modal';
import EditGroupModal from '../dashboard/modals/edit-group-modal';
import { useDashboard } from '@/store/dashboard.provider';
import DashboardGroupFilter from '../dashboard/dashboad-group-filter';

export default function DashboardRoaster() {
  const screenSize = useScreenSize();

  const { institution, users } = useMain();
  const { role } = useAuthenticatedAuth();

  const { filteredGroups } = useDashboard();

  const { uploadUsers, setIsUploadingMembers, isUploadingMembers, removeUser } =
    useInstitutionMembers();
  const { hoveredUser, toggleUser, onHoverUser } = useDashboardUserEdit();

  const {
    search,
    setSearch,
    openRegisterAthletesModal,
    setOpenRegisterAthletesModal,
    openRegisterTrainersModal,
    setOpenRegisterTrainersModal,
    openAddMemberViaCsvModal,
    setOpenAddMemberViaCsvModal,
  } = useDashboardMembers();

  const { setCsvUserEmails } = useCsvMembersUpload();

  const [openAddGroupModal, setOpenAddGroupModal] = useState(false);
  const [openDeleteGroupModal, setOpenDeleteGroupModal] = useState(false);
  const [openFilterMenu, setOpenFilterMenu] = useState<boolean>(false);

  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);

  const [filterBy, setFilterBy] = useState<FilterMembersBy>(
    FilterMembersBy.GROUP
  );

  const [filteredMembers, setFilteredMembers] = useState<User[]>(
    (institution.trainers || []).concat(institution.athletes || [])
  );

  const [removeUserFromInstitution, setRemoveUserFromInstitution] =
    useState<User | null>(null);

  const anchorElRef = useRef<HTMLDivElement | null>(null);

  const updateFilteredMembers = (filter: FilterMembersBy) => {
    switch (filter) {
      case FilterMembersBy.INSTITUTION: {
        setFilteredMembers(
          (institution.trainers || []).concat(institution.athletes || [])
        );
        break;
      }
      case FilterMembersBy.ATHLETES: {
        setFilteredMembers(institution.athletes || []);
        break;
      }
      case FilterMembersBy.COACHES: {
        setFilteredMembers(institution.trainers || []);
        break;
      }
      case FilterMembersBy.GROUP: {
        // Handled by the main render
        break;
      }
      default: {
        setFilteredMembers(
          (institution.trainers || []).concat(institution.athletes || [])
        );
        break;
      }
    }
  };

  useEffect(() => {
    updateFilteredMembers(filterBy);
  }, [institution, users]);

  return (
    <DashboardPageContainer>
      <Box
        width="100%"
        maxWidth={MAX_WIDTH_DASHBOARD_ITEM}
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        sx={{
          py: 3.35,
          borderRadius: 2,
          overflowX: 'hidden',
        }}
        gap={2}
      >
        <Box
          width="100%"
          display="flex"
          flexWrap="wrap"
          justifyContent={screenSize.isMobile ? 'center' : 'flex-start'}
          alignItems="center"
          gap={2}
        >
          <TextField
            size="small"
            label="Search User"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: 10,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.text.primary,
              },
            }}
          />
          {lib.firebase.auth.isManager(role) && (
            <>
              <Typography
                display="flex"
                justifyContent="center"
                alignItems="center"
                onClick={() => setOpenRegisterAthletesModal(true)}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  py: 1,
                  px: 2,
                  borderRadius: 10,
                  color: theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + New Athlete
              </Typography>
              <Typography
                display="flex"
                justifyContent="center"
                alignItems="center"
                onClick={() => setOpenRegisterTrainersModal(true)}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  py: 1,
                  px: 2,
                  borderRadius: 10,
                  color: theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + New Coach
              </Typography>
              <Typography
                display="flex"
                justifyContent="center"
                alignItems="center"
                onClick={() => setOpenAddGroupModal(true)}
                sx={{
                  backgroundColor: theme.palette.secondary.main,
                  py: 1,
                  px: 6,
                  borderRadius: 10,
                  color: theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + New Group
              </Typography>
              <Tooltip title="Upload Members via CSV">
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  onClick={() => setOpenAddMemberViaCsvModal(true)}
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  <IconButton
                    sx={{
                      m: 0,
                      p: 0.5,
                      backgroundColor: theme.palette.background.light,
                      borderRadius: 1,
                    }}
                  >
                    <FileUploadOutlined fontSize="small" />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    Import
                  </Typography>
                </Box>
              </Tooltip>
            </>
          )}
        </Box>
        <Box
          display="flex"
          justifyContent={screenSize.isMobile ? 'center' : 'flex-start'}
          gap={2}
          flexWrap="wrap"
        >
          <Box
            ref={anchorElRef}
            width={200}
            display="flex"
            justifyContent="center"
            alignItems="center"
            onClick={() => {
              setOpenFilterMenu(true);
            }}
            sx={{
              backgroundColor: theme.palette.text.primary,
              py: 1,
              borderRadius: 10,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: 12,
                fontWeight: 600,
                userSelect: 'none',
              }}
            >
              View by {filterBy}
            </Typography>
            <ArrowDropDown
              fontSize="small"
              sx={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.palette.text.secondary,
              }}
            />
          </Box>
          {filterBy === FilterMembersBy.GROUP && <DashboardGroupFilter />}
        </Box>
      </Box>

      {filterBy === FilterMembersBy.GROUP ? (
        !filteredGroups.length ? (
          <Typography>No groups</Typography>
        ) : (
          <Grid
            container
            spacing={2}
            justifyContent={
              filteredGroups.length === 1 ? 'center' : 'flex-start'
            }
            alignItems="flex-start"
            width="100%"
          >
            {filteredGroups
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((g) => (
                <Grid
                  key={g.id}
                  size={
                    filteredGroups.length === 1
                      ? {
                          xs: 12,
                          sm: 12,
                          md: 6,
                          lg: 6,
                        }
                      : {
                          xs: 12,
                          sm: 12,
                          md: 6,
                          lg: 6,
                        }
                  }
                  display="flex"
                  justifyContent="center"
                >
                  <DashboardGroupCard
                    group={g}
                    search={search}
                    setOpenEditAthleteModal={setOpenEditAthleteModal}
                  />
                </Grid>
              ))}
          </Grid>
        )
      ) : (
        <Box
          width="100%"
          display="flex"
          flexWrap="wrap"
          gap={screenSize.isMobile ? 4 : 6}
          sx={{
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            px: 2,
          }}
        >
          {!filteredMembers.length ? (
            <Typography>No users found</Typography>
          ) : (
            filteredMembers.map((user) => {
              if (!user || !user.displayName) return null;

              if (
                search.length &&
                !user.displayName.toLowerCase().includes(search.toLowerCase())
              )
                return null;

              const names = user.displayName.split(' ');

              return (
                <Box
                  key={user.uid}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={1}
                  sx={{ position: 'relative' }}
                  onMouseEnter={() => onHoverUser(user)}
                  onMouseLeave={() => onHoverUser(null)}
                >
                  {lib.firebase.auth.isManager(role) &&
                    user.uid === hoveredUser?.uid && (
                      <IconButton
                        className="remove-icon"
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setRemoveUserFromInstitution(user);
                        }}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: theme.palette.error.main,
                          zIndex: 1,
                        }}
                      >
                        <Remove sx={{ fontSize: 10 }} />
                      </IconButton>
                    )}

                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      className="avatar-border"
                      src={user.photoURL || USER_AVATAR_IMG_URL}
                      sx={{
                        width: screenSize.isMobile ? 70 : 80,
                        height: screenSize.isMobile ? 70 : 80,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        toggleUser(user);
                        setOpenEditAthleteModal(true);
                      }}
                    />

                    {institution.trainers?.some(
                      (trainer) => trainer.uid === user.uid
                    ) && (
                      <Typography
                        sx={{
                          width: 16,
                          height: 16,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: '50%',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        T
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: 'center',
                      fontWeight: 400,
                      fontSize: screenSize.isMobile ? 12 : 14,
                    }}
                  >
                    {names.length > 1 ? (
                      <>
                        {names[0]}
                        <br />
                        {names[1].toUpperCase()}
                      </>
                    ) : (
                      <>{user.displayName.toUpperCase()}</>
                    )}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      )}

      <Menu
        anchorEl={anchorElRef.current}
        open={openFilterMenu}
        onClose={() => {
          setOpenFilterMenu(false);
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          top: 36,
        }}
      >
        {Object.values(FilterMembersBy).map((filter) => (
          <Box
            key={filter}
            width={200}
            onClick={() => {
              setFilterBy(filter);
              setOpenFilterMenu(false);

              updateFilteredMembers(filter);
            }}
            sx={{
              px: 2,
              py: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Typography
              sx={{
                color: theme.palette.text.primary,
                fontSize: 12,
                fontWeight: 600,
                userSelect: 'none',
              }}
            >
              View by {filter}
            </Typography>
          </Box>
        ))}
      </Menu>

      <EditAthleteModal
        open={openEditAthleteModal}
        setOpen={setOpenEditAthleteModal}
      />

      <RegisterUsersDashboardModal
        open={openRegisterAthletesModal}
        setOpen={setOpenRegisterAthletesModal}
        registerRole={UserRole.ATHLETE}
      />

      <RegisterUsersDashboardModal
        open={openRegisterTrainersModal}
        setOpen={setOpenRegisterTrainersModal}
        registerRole={UserRole.TRAINER}
      />

      <AddGroupModal open={openAddGroupModal} setOpen={setOpenAddGroupModal} />

      <EditGroupModal />

      <DeleteGroupModal />

      <MyModal
        isOpen={openAddMemberViaCsvModal}
        setIsOpen={(open) => setOpenAddMemberViaCsvModal(open)}
        onConfirm={undefined}
        onCancel={() => setOpenAddMemberViaCsvModal(false)}
        cancelText="Close"
      >
        <FileUpload
          label="CSV of users"
          input={InputType.CSV}
          onFileUpload={async (file) => {
            setIsUploadingMembers(true);

            const users = await uploadUsers(file);
            setOpenAddMemberViaCsvModal(false);
            setCsvUserEmails(users.map((d) => d.email!));
          }}
        />
      </MyModal>

      <MyModal
        isOpen={!!removeUserFromInstitution}
        setIsOpen={(open) => {
          if (!open) setRemoveUserFromInstitution(null);
        }}
        onConfirm={async () => {
          if (removeUserFromInstitution) {
            await removeUser(removeUserFromInstitution.uid);
            setRemoveUserFromInstitution(null);
          }
        }}
        onCancel={() => setRemoveUserFromInstitution(null)}
        confirmText="Remove"
        cancelText="Cancel"
      >
        <Typography>
          Remove <strong>{removeUserFromInstitution?.displayName}</strong> from
          the institution?
        </Typography>
      </MyModal>

      {isUploadingMembers && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
          sx={{ zIndex: 130000, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <CircularProgress size={24} />
          <Typography fontSize={20}>Registering...</Typography>
        </Box>
      )}
    </DashboardPageContainer>
  );
}
