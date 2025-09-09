'use client';

import { Add, FileUploadOutlined, MoreVert, Remove } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { theme } from '@/app/style';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { AthletesTrainers } from '@/common/enum/athletes-trainer.enum';
import { CommonService } from '@/common/service/common.service';
import { isManager } from '@/common/service/util/firebase-auth.util';
import { handleApiRequest } from '@/common/type/state.type';
import DashboardEditAthleteModal from '@/components/dashboard-edit-athlete-modal/dashboard-edit-athlete-modal';
import RegisterUsersDashboard from '@/components/dashboard-register-users-modal/dashboard-register-users-modal';
import FileUpload from '@/components/file-upload/file-upload';
import HorizontalItemsList from '@/components/horizontal-items-list/horizontal-items-list';
import LoadingOverlay from '@/components/loading-overlay/loading-overlay';
import MyModal from '@/components/modal/modal';
import { SearchBar } from '@/components/search-bar/search-bar';
import { MAX_WIDTH } from '@/components/trainer-day-view/constant';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import type { User } from '@/controller/user/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';

const commonService = CommonService.instance;
const firebaseService = commonService.firebase;

export default function DashboardInstitutionPage() {
  const {
    selectedInstitution,
    setSelectedInstitution,
    members,
    refetchMembers,
    refetchUsers,
  } = useDashboard();
  const screenSize = useScreenSize();
  const router = useRouter();

  const { profile, users } = useMain();

  const [selectedView, setSelectedView] = useState<AthletesTrainers>(
    AthletesTrainers.ATHLETES
  );

  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({
    add_member: false,
    add_trainer: false,
    add_group: false,
    add_member_via_csv: false,
    edit_athlete: false,
  });
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [csvUserEmails, setCsvUserEmails] = useState<string[]>([]);
  const [isUploadingMembers, setIsUploadingMembers] = useState(false);

  const roles = profile.customClaims.role || [];

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

    const newUsers = [] as User[];

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

    /* if (trainers.length) {
      handleApiRequest(
        router,
        () =>
          InstitutionController.addTrainer(selectedInstitution.id, {
            trainerIds: trainers.map((user) => user.uid),
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedTrainerIds = prev.trainerIds
              ? [...prev.trainerIds, ...trainers.map((user) => user.uid)]
              : trainers.map((user) => user.uid);

            const updatedTrainers = prev.trainers
              ? [...prev.trainers, ...trainers]
              : [...trainers];

            return {
              ...prev,
              trainers: updatedTrainers,
              trainerIds: updatedTrainerIds,
            };
          });
        },
        undefined,
        'Failed to register trainers'
      );
    } */

    /* if (athletes.length) {
      handleApiRequest(
        router,
        () =>
          InstitutionController.addAthlete(selectedInstitution.id, {
            athleteIds: athletes.map((user) => user.uid),
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedAthleteIds = prev.athleteIds
              ? [...prev.athleteIds, ...athletes.map((user) => user.uid)]
              : athletes.map((user) => user.uid);

            const updatedAthletes = prev.athletes
              ? [...prev.athletes, ...athletes]
              : [...athletes];

            return {
              ...prev,
              athletes: updatedAthletes,
              athleteIds: updatedAthleteIds,
            };
          });
        },
        undefined,
        'Failed to register athletes'
      );
    } */

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
          ? InstitutionController.removeAthlete(selectedInstitution.id, {
              userId,
            })
          : InstitutionController.removeTrainer(selectedInstitution.id, {
              userId,
            }),
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

    const text = await file.text();
    const rows = text.split('\n').filter((row) => row);

    rows.forEach((row, i) => {
      let [displayName, email, password, role] = row.split(',');

      displayName = displayName.trim();
      email = email.trim();
      password = password.trim();
      role = role.trim();

      if (!displayName || !email || !password || !role) {
        toast.error(`Row ${i + 1} is missing required fields`);
        return;
      }

      if (![UserRole.ATHLETE, UserRole.TRAINER].includes(role as UserRole)) {
        toast.error(`Row ${i + 1} has an invalid role: ${role}`);
        return;
      }

      const input = {
        displayName,
        email,
        password,
        role: role as UserRole,
      };

      // user already exists
      if (users.some((user) => user.email === email)) {
        setCsvUserEmails((prev) => [...prev, email]);

        if (i === rows.length - 1) {
          refetchUsers();
          refetchMembers(
            `${BACKEND_API_BASE_URL}/institution/${selectedInstitution?.id}/find/all`
          );
        }

        return;
      }

      handleApiRequest(
        router,
        () => firebaseService.functions.createUserWithRole(input),
        () => {
          setCsvUserEmails((prev) => [...prev, email]);

          if (i === rows.length - 1) {
            refetchUsers();
            refetchMembers(
              `${BACKEND_API_BASE_URL}/institution/${selectedInstitution?.id}/find/all`
            );
          }
        },
        () => {
          setIsUploadingMembers(false);
        },
        `Failed to register user ${email} at row ${i + 1}`
      );
    });
  };

  const HorizontalItems = () => {
    return (
      <HorizontalItemsList
        dashboardInstitutionsView
        items={
          Object.values(AthletesTrainers).map((item) => ({
            label: item,
            value: item,
          })) || []
        }
        value={selectedView}
        setValue={(value) => {
          setSelectedView(value as AthletesTrainers);
        }}
        checkIsSameValue={(value: string) => {
          return selectedView === value;
        }}
        alertOnChange
        onArrowClick={() => {}}
      />
    );
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      gap={screenSize.isSmallTablet || screenSize.isMobile ? 0 : 5}
      sx={{
        backgroundColor: theme.palette.background.default,
        pb: 2,
      }}
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
              <Box
                sx={{
                  height: 16,
                  width: 4,
                  borderRadius: 5,
                  backgroundColor: theme.palette.primary.main,
                }}
              />
              <Typography
                fontWeight={600}
                fontSize={16}
                textAlign="center"
                sx={{
                  textTransform: 'uppercase',
                }}
              >
                {selectedInstitution?.name || 'Select A Group'}
              </Typography>
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  zIndex: 1,
                }}
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
            sx={{
              mt: 1,
            }}
          >
            <Box
              sx={{
                height: 16,
                width: 4,
                borderRadius: 5,
                backgroundColor: theme.palette.primary.main,
                ml: 1,
              }}
            />

            <Typography
              fontWeight={600}
              fontSize={16}
              sx={{
                textTransform: 'uppercase',
              }}
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
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
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
          {isManager(roles) && (
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
                onClick={() =>
                  setModal({
                    ...modal,
                    add_member: true,
                  })
                }
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
                onClick={() =>
                  setModal({
                    ...modal,
                    add_member_via_csv: true,
                  })
                }
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
          sx={{
            height: 7,
            backgroundColor: theme.palette.background.paper,
          }}
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
                  sx={{
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredUser(user)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  {isManager(roles) && user.uid === hoveredUser?.uid && (
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
                      members.find((m) => m.id === user.uid)?.profileImageUrl ||
                      '/user_avatar.png'
                    }
                    sx={{
                      width: screenSize.isMobile ? 70 : 80,
                      height: screenSize.isMobile ? 70 : 80,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setEditUser(user);
                      setModal((prev) => ({ ...prev, edit_athlete: true }));
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
        isOpen={modal.add_member}
        setIsOpen={(open) => setModal({ ...modal, add_member: open })}
        onConfirm={undefined}
        onCancel={() => setModal({ ...modal, add_member: false })}
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
        isOpen={modal.add_member_via_csv}
        setIsOpen={(open) => setModal({ ...modal, add_member_via_csv: open })}
        onConfirm={undefined}
        onCancel={() => setModal({ ...modal, add_member_via_csv: false })}
        cancelText="Close"
      >
        <FileUpload
          label="CSV of users"
          input="csv"
          onFileUpload={async (file) => {
            handleCsvFileUpload(file);
          }}
        />
      </MyModal>
      <DashboardEditAthleteModal
        isOpen={modal.edit_athlete}
        setModal={setModal}
        editUser={editUser}
        setEditUser={setEditUser}
      />

      {isUploadingMembers && <LoadingOverlay title="Registering..." />}
    </Box>
  );
}
