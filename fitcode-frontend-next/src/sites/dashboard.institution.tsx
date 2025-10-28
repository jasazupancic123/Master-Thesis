'use client';

import { Add, FileUploadOutlined, MoreVert, Remove } from '@mui/icons-material';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { theme } from '@/app/style';
import { useDashboardUserEdit } from '@/components/dashboard/context/user-edit.context';
import DashboardEditAthleteModal from '@/components/dashboard/dashboard-edit-athlete-modal';
import RegisterUsersDashboard from '@/components/dashboard/dashboard-register-users-modal';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import type { AuthUser } from '@/core/auth/type/user.type';
import { AthletesTrainers } from '@/core/institution/enum/athletes-trainer.enum';
import { InstitutionController } from '@/core/institution/institution.controller';
import { Gender } from '@/core/profile/enum/gender.enum';
import { SportLevel } from '@/core/profile/enum/sport-level.enum';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { ProfileController } from '@/core/profile/profile.controller';
import type { ImportProfile, Profile } from '@/core/profile/type/user.type';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';
import HorizontalItemsList from '@/ui/horizontal-items-list';
import MyModal from '@/ui/modal';
import { SearchBar } from '@/ui/search-bar/search-bar';
import SimpleCircle from '@/ui/simple-circle';

export default function DashboardInstitutionPage() {
  const screenSize = useScreenSize();
  const router = useRouter();
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

  const { selectedInstitution, setSelectedInstitution, setMembers, setUsers } =
    useDashboard();

  const [selectedView, setSelectedView] = useState<AthletesTrainers>(
    AthletesTrainers.ATHLETES
  );

  const [search, setSearch] = useState('');
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);
  const [openAddMemberViaCsvModal, setOpenAddMemberViaCsvModal] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [csvUserEmails, setCsvUserEmails] = useState<string[]>([]);
  const [isUploadingMembers, setIsUploadingMembers] = useState(false);

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

  const handleRemoveUser = (userId: string, view: AthletesTrainers) => {
    if (!selectedInstitution) return;

    handleApiRequest(
      router,
      () =>
        view === AthletesTrainers.ATHLETES
          ? InstitutionController.getInstance().removeAthlete(
              selectedInstitution.id,
              { userId }
            )
          : InstitutionController.getInstance().removeTrainer(
              selectedInstitution.id,
              { userId }
            ),
      () => {
        setSelectedInstitution((prev) => {
          if (!prev) return null;
          const updatedUsers = (
            view === AthletesTrainers.ATHLETES ? prev.athletes : prev.trainers
          )?.filter((a) => a.uid !== userId);
          const updatedUserIds =
            view === AthletesTrainers.ATHLETES
              ? prev.athleteIds.filter((id) => id !== userId)
              : prev.trainerIds.filter((id) => id !== userId);

          return view === AthletesTrainers.ATHLETES
            ? { ...prev, athletes: updatedUsers, athleteIds: updatedUserIds }
            : { ...prev, trainers: updatedUsers, trainerIds: updatedUserIds };
        });
        toast.success(
          `${view[0].toUpperCase() + view.slice(1, view.length - 1).toLowerCase()} removed successfully`
        );
      },
      undefined,
      `Failed to remove ${view[0].toUpperCase() + view.slice(1, view.length - 1).toLowerCase()}`
    );
  };

  const handleCsvFileUpload = async (file: File) => {
    setIsUploadingMembers(true);

    Papa.parse<ImportProfile>(file, {
      header: true,
      skipEmptyLines: true,
      error: (e: Error) =>
        toast.error(`Failed to parse CSV file: ${e.message}`),
      transform: (value, column: keyof ImportProfile) => {
        switch (column) {
          case 'email':
            value = value.trim().toLowerCase();
            break;
          case 'password':
            value = value.trim();
            break;
          case 'displayName':
            value = value.trim();
            break;
          case 'photoURL':
            value = value.trim();
            break;
          case 'role':
            value = value.trim().toLowerCase();
            if (
              ![UserRole.ATHLETE, UserRole.TRAINER].includes(value as UserRole)
            )
              value = UserRole.ATHLETE;

            break;
          case 'level':
            value = value.trim().toLowerCase();
            if (
              ![
                SportLevel.BEGINNER,
                SportLevel.INTERMEDIATE,
                SportLevel.ADVANCED,
              ].includes(value as SportLevel)
            )
              value = SportLevel.BEGINNER;
            break;
          case 'gender':
            value = value.trim().toLowerCase();
            if (value && ![Gender.M, Gender.F].includes(value as Gender))
              value = Gender.M;
            break;
          case 'birthDate':
            value = value.trim();
            if (value && isNaN(new Date(value).getTime())) value = '';
            break;
        }

        return value;
      },
      complete: async (results) => {
        results.data.pop();

        // validate rows
        const errors: { row: number; message: string }[] = [];
        results.data.forEach((r) => {
          const row = results.data.indexOf(r) + 2;
          if (!r.email) errors.push({ row, message: 'Missing email' });
          if (!r.password) errors.push({ row, message: 'Missing password' });
          if (!r.displayName) errors.push({ row, message: 'Missing name' });
          if (!r.role) errors.push({ row, message: 'Missing role' });
        });

        if (errors.length) {
          toast.error(
            `Errors in CSV file:\n${errors
              .map((e) => `Row ${e.row}: ${e.message}`)
              .join('\n')}`
          );

          setIsUploadingMembers(false);
          return;
        }

        const data: ImportProfile[] = results.data.map((r) => ({
          email: r.email,
          password: r.password,
          displayName: r.displayName,
          photoURL: undefined,
          role: r.role,
          sport: r.sport || undefined,
          level: r.level || undefined,
          gender: r.gender || undefined,
          birthDate: r.birthDate ? new Date(r.birthDate) : undefined,
        }));

        await handleApiRequest(
          router,
          () =>
            ProfileController.getInstance().importProfiles({ profiles: data }),
          (res) => {
            setOpenAddMemberViaCsvModal(false);
            setCsvUserEmails(data.map((d) => d.email));
            setMembers((prev) => [
              ...prev,
              ...(res.successful || []).map(
                (u) =>
                  ({
                    uid: u.uid,
                    email: u.email!,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }) as Profile
              ),
            ]);

            const authUsers = res.successful || [];
            setUsers((prev) => [...prev, ...authUsers]);
            setCurrentUsers((prev) => [...prev, ...authUsers]);
            setFilteredUsers((prev) => [...prev, ...authUsers]);
          },
          undefined,
          'Failed to register users'
        );
      },
    });

    setIsUploadingMembers(false);
  };

  function HorizontalItems() {
    return (
      <HorizontalItemsList
        dashboardInstitutionsView
        value={selectedView}
        setValue={(value) => setSelectedView(value as AthletesTrainers)}
        checkIsSameValue={(value: string) => selectedView === value}
        alertOnChange
        items={
          Object.values(AthletesTrainers).map((item) => ({
            label: item,
            value: item,
          })) || []
        }
      />
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      gap={screenSize.isSmallTablet || screenSize.isMobile ? 0 : 5}
      sx={{ backgroundColor: theme.palette.background.default, pb: 2 }}
    >
      {screenSize.isSmallTablet || screenSize.isMobile ? (
        <>
          <HorizontalItems />
          <Box width="100%" sx={{ position: 'relative' }}>
            <Box
              width="80%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              mt={2}
              gap={0.75}
              sx={{ mx: 'auto' }}
            >
              <SimpleCircle />

              <Typography
                fontWeight={600}
                fontSize={16}
                textAlign="center"
                sx={{ textTransform: 'uppercase' }}
              >
                {selectedInstitution?.name || 'Select A Group'}
              </Typography>

              <IconButton
                sx={{ position: 'absolute', right: 0, top: 0, zIndex: 1 }}
              >
                <MoreVert fontSize="medium" />
              </IconButton>
            </Box>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          width="100%"
          justifyContent="space-around"
          alignItems="flex-start"
        >
          <Box
            width="25%"
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={1}
            sx={{ mt: 1 }}
          >
            <SimpleCircle />

            <Typography
              fontWeight={600}
              fontSize={16}
              sx={{ textTransform: 'uppercase' }}
            >
              {selectedInstitution?.name || 'Select A Group'}
            </Typography>
          </Box>

          <Box width="50%">
            <HorizontalItems />
          </Box>

          <Box width="25%" display="flex" justifyContent="flex-end" mt={1}>
            <IconButton sx={{ m: 0, p: 0 }}>
              <MoreVert fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      )}
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
              <IconButton
                sx={{
                  m: 0,
                  p: 0.5,
                  backgroundColor: theme.palette.background.light,
                  borderRadius: 1,
                }}
                onClick={() => setOpenAddMemberModal(true)}
              >
                <Add fontSize="small" />
              </IconButton>
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
            </Box>
          )}
        </SearchBar>
      </Box>
      <Box width="100%" display="flex" flexDirection="column">
        <Box
          width="100%"
          sx={{ height: 7, backgroundColor: theme.palette.background.paper }}
        />
        <Box
          width="100%"
          display="flex"
          flexWrap="wrap"
          gap={screenSize.isMobile ? 4 : 6}
          sx={{
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            mt: 2,
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUser(user.uid, selectedView);
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
      </Box>

      <MyModal
        isOpen={openAddMemberModal}
        setIsOpen={(open) => setOpenAddMemberModal(open)}
        onConfirm={undefined}
        onCancel={() => setOpenAddMemberModal(false)}
        cancelText="Close"
      >
        <RegisterUsersDashboard
          registerRole={
            selectedView === AthletesTrainers.ATHLETES
              ? UserRole.ATHLETE
              : UserRole.TRAINER
          }
        />
      </MyModal>

      <MyModal
        isOpen={openAddMemberViaCsvModal}
        setIsOpen={(open) => setOpenAddMemberViaCsvModal(open)}
        onConfirm={undefined}
        onCancel={() => setOpenAddMemberViaCsvModal(false)}
        cancelText="Close"
      >
        <FileUpload
          label="CSV of users"
          input="csv"
          onFileUpload={async (file) => handleCsvFileUpload(file)}
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
