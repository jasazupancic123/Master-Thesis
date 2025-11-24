'use client';

import { FileUploadOutlined, Remove } from '@mui/icons-material';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { theme } from '@/app/style';
import { useDashboardUserEdit } from '@/components/dashboard/context/user-edit.context';
import useInstitutionMembers from '@/components/dashboard/hooks/use-institution-members.hook';
import DashboardEditAthleteModal from '@/components/dashboard/modals/dashboard-edit-athlete-modal';
import RegisterUsersDashboardModal from '@/components/dashboard/modals/dashboard-register-users-modal';
import { MAX_WIDTH_DASHBOARD } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import type { AuthUser } from '@/core/auth/type/user.type';
import { AthletesTrainers } from '@/core/institution/enum/athletes-trainer.enum';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { InputType } from '@/lib/common/const/input-type.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import AddButton from '@/ui/add-button';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';
import { SearchBar } from '@/ui/search-bar/search-bar';

export default function DashboardInstitution() {
  const screenSize = useScreenSize();
  const { role } = useAuthenticatedAuth();
  const { users } = useMain();

  const {
    hoveredUser,
    currentUsers,
    filteredUsers,
    setFilteredUsers,
    setCurrentUsers,
    toggleUser,
    onHoverUser,
  } = useDashboardUserEdit();

  const { selectedInstitution } = useDashboard();
  const { removeUser, uploadUsers, isUploadingMembers, setIsUploadingMembers } =
    useInstitutionMembers();

  const [search, setSearch] = useState('');
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);
  const [openAddMemberViaCsvModal, setOpenAddMemberViaCsvModal] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [csvUserEmails, setCsvUserEmails] = useState<string[]>([]);

  const [selectedView, setSelectedView] = useState<AthletesTrainers>(
    AthletesTrainers.ATHLETES
  );

  useEffect(() => {
    const current =
      selectedView === AthletesTrainers.ATHLETES
        ? selectedInstitution?.athletes
        : (selectedInstitution?.trainers ?? []);

    if (!current) return;
    setSearch('');
    setCurrentUsers(current);
    setFilteredUsers(current);
    setLoading(false);
  }, [selectedView, selectedInstitution]);

  useEffect(() => {
    if (!selectedInstitution || !csvUserEmails.length) return;

    const newUsers = [] as AuthUser[];
    for (const email of csvUserEmails) {
      if (!email) continue;

      const user = users.find((user) => user.email === email.toLowerCase());
      if (!user) continue;
      newUsers.push(user);
    }

    const athletes = newUsers
      .filter((user) => user.customClaims.role.includes(UserRole.ATHLETE))
      .filter((user) => !selectedInstitution?.athleteIds?.includes(user.uid));

    const trainers = newUsers
      .filter((user) => user.customClaims.role.includes(UserRole.TRAINER))
      .filter((user) => !selectedInstitution?.trainerIds?.includes(user.uid));

    if (!trainers.length && !athletes.length) {
      toast.error('No new users to add');

      setCsvUserEmails([]);
      setIsUploadingMembers(false);
      return;
    }

    toast.success('Successfully added users');
    setCsvUserEmails([]);
    setIsUploadingMembers(false);
  }, [users]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH_DASHBOARD}
      sx={{ backgroundColor: theme.palette.background.default, mt: 2 }}
      gap={2}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        gap={1}
        alignItems="center"
      >
        {/* Athletes / Trainers selector */}
        {Object.values(AthletesTrainers).map((type) => {
          const isSelected = selectedView === type;

          return (
            <Box
              key={type}
              display="flex"
              justifyContent="center"
              alignItems="center"
              onClick={() => {
                setSelectedView(type);
              }}
              sx={{
                px: 2,
                py: 0.5,
                backgroundColor: isSelected
                  ? theme.palette.primary.main
                  : theme.palette.background.default,
                border: isSelected
                  ? `1px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.text.primary}`,
                borderRadius: 1,
                cursor: 'pointer',
              }}
            >
              <Typography
                textAlign="center"
                fontWeight={600}
                width={80}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: isSelected
                    ? theme.palette.text.secondary
                    : theme.palette.text.primary,
                  userSelect: 'none',
                }}
              >
                {type.charAt(0)?.toUpperCase() + type.slice(1)?.toLowerCase()}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box
        width="100%"
        display="flex"
        gap={1}
        sx={{ justifyContent: 'center', alignItems: 'center' }}
      >
        <SearchBar
          placeholder={`Search ${selectedView.toLowerCase()}`}
          value={search}
          handleSearchChange={(e) => {
            const filtered = currentUsers.filter((user) => {
              if (!user.displayName) return false;
              return user.displayName
                .toLowerCase()
                .includes(e.target.value.toLowerCase());
            });

            setFilteredUsers(filtered);
            setSearch(e.target.value);
          }}
          sx={{
            width: screenSize.isSmallerThanLaptop
              ? '50% !important'
              : '33% !important',
            my: screenSize.isSmallTablet || screenSize.isMobile ? 2 : 0,
            position: 'relative',
          }}
        >
          {lib.firebase.auth.isManager(role) && (
            <Box
              display="flex"
              gap={1.5}
              sx={{
                position: 'absolute',
                right: -80,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <AddButton
                onClick={() => setOpenAddMemberModal(true)}
                tooltip="Add members"
              />
              <Tooltip title="Upload Members via CSV">
                <IconButton
                  sx={{
                    m: 0,
                    p: 0.5,
                    backgroundColor: theme.palette.background.light,
                    borderRadius: 1,
                  }}
                  onClick={() => setOpenAddMemberViaCsvModal(true)}
                >
                  <FileUploadOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </SearchBar>
      </Box>

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
        {loading ? (
          <></>
        ) : !currentUsers.length ? (
          <Typography>No {selectedView.toLowerCase()} found</Typography>
        ) : (
          filteredUsers.map((user) => {
            if (!user || !user.displayName) return;
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
                        await removeUser(user.uid);
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

                <Avatar
                  className="avatar-border"
                  src={
                    users.find((m) => m.uid === user.uid)?.photoURL ||
                    USER_AVATAR_IMG_URL
                  }
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

      <RegisterUsersDashboardModal
        open={openAddMemberModal}
        setOpen={setOpenAddMemberModal}
        registerRole={
          selectedView === AthletesTrainers.ATHLETES
            ? UserRole.ATHLETE
            : UserRole.TRAINER
        }
      />

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

            const authUsers = await uploadUsers(file);

            setOpenAddMemberViaCsvModal(false);
            setCsvUserEmails(authUsers.map((d) => d.email!));

            const athletes = authUsers.filter((user) =>
              user.customClaims.role.includes(UserRole.ATHLETE)
            );

            const trainers = authUsers.filter((user) =>
              user.customClaims.role.includes(UserRole.TRAINER)
            );

            if (selectedView === AthletesTrainers.ATHLETES) {
              setCurrentUsers((prev) => [...prev, ...athletes]);
              setFilteredUsers((prev) => [...prev, ...athletes]);
            } else {
              setCurrentUsers((prev) => [...prev, ...trainers]);
              setFilteredUsers((prev) => [...prev, ...trainers]);
            }
          }}
        />
      </MyModal>

      <DashboardEditAthleteModal
        open={openEditAthleteModal}
        setOpen={setOpenEditAthleteModal}
      />

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
    </Box>
  );
}
