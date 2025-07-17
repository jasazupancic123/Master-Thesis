'use client';

import { theme } from '@/app/style';
import HorizontalItemsList from '@/components/horizontal-items-list/horizontal-items-list';
import { MAX_WIDTH } from '@/components/trainer-day-view/constant';
import { useDashboard } from '@/store/dashboard-provider';
import { Add, MoreVert, Remove } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { useScreenSize } from '@/store/screen-size-provider';
import { AthletesTrainers } from '@/common/enum/athletes-trainer.enum';
import { useEffect, useState } from 'react';
import { SearchBar } from '@/components/search-bar/search-bar';
import { User } from '@/controller/user/type/user.type';
import MyModal from '@/components/modal/modal';
import RegisterUsersDashboard from '@/components/dashboard-register-users-modal/dashboard-register-users-modal';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { isManager } from '@/common/service/util/firebase-auth.util';
import { handleApiRequest } from '@/common/type/state.type';
import { InstitutionController } from '@/controller/institution/institution.controller';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DashboardInstitutionPage() {
  const { token, profile, selectedInstitution, setSelectedInstitution } =
    useDashboard();
  const screenSize = useScreenSize();
  const router = useRouter();

  const [selectedView, setSelectedView] = useState<AthletesTrainers>(
    AthletesTrainers.ATHLETES
  );

  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleRemoveUser = (userId: string, view: AthletesTrainers) => {
    if (!selectedInstitution) return;

    handleApiRequest(
      router,
      () =>
        view === AthletesTrainers.ATHLETES
          ? InstitutionController.removeAthletes(
              token,
              selectedInstitution.id,
              {
                athleteIds: [userId],
              }
            )
          : InstitutionController.removeTrainers(
              token,
              selectedInstitution.id,
              {
                trainerIds: [userId],
              }
            ),
      (institution) => {
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
            onArrowClick={(direction) => {}}
          />
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
              onArrowClick={(direction) => {}}
            />
          </Box>
          <Box width="25%" display="flex" justifyContent="flex-end" mt={1}>
            <IconButton sx={{ m: 0, p: 0 }}>
              <MoreVert fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        width="100&"
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
          maxWidth={
            screenSize.isSmallTablet || screenSize.isMobile ? '50%' : '85%'
          }
          sx={{
            my: screenSize.isSmallTablet || screenSize.isMobile ? 2 : 0,
          }}
        />
        {isManager(roles) && (
          <IconButton
            sx={{
              m: 0,
              p: 0.5,
              backgroundColor: theme.palette.background.light,
              borderRadius: 1,
            }}
            onClick={() => setOpenModal(true)}
          >
            <Add fontSize="small" />
          </IconButton>
        )}
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
            alignItems: 'center',
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
                    justifyContent: 'center',
                    alignItems: 'center',
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
                    //src={user.profileImageUrl || '/user_avatar.png'}
                    src="/user_avatar.png"
                    sx={{
                      width: screenSize.isMobile ? 70 : 80,
                      height: screenSize.isMobile ? 70 : 80,
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
        isOpen={openModal}
        setIsOpen={(open) => setOpenModal(open)}
        onConfirm={undefined}
        onCancel={() => setOpenModal(false)}
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
    </Box>
  );
}
