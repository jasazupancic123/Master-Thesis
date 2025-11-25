'use client';

import { Edit, FileDownload, Remove } from '@mui/icons-material';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import ImportWorkloadsModal from '../workloads/import-workloads-modal';
import EditInstitutionModal from './modals/edit-institution-modal';
import { theme } from '@/app/style';
import { useDashboardUserEdit } from '@/components/dashboard/context/user-edit.context';
import useInstitutionMembers from '@/components/dashboard/hooks/use-institution-members.hook';
import DashboardEditAthleteModal from '@/components/dashboard/modals/dashboard-edit-athlete-modal';
import { MAX_WIDTH_DASHBOARD } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { AthletesTrainers } from '@/core/institution/enum/athletes-trainer.enum';
import { TrainingController } from '@/core/training/training.controller';
import type { ImportWorkload } from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
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
  const { removeUser } = useInstitutionMembers();

  const [search, setSearch] = useState('');
  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);

  const [openEditInstitutionModal, setOpenEditInstitutionModal] =
    useState(false);
  const [openImportWorkloadsModal, setOpenImportWorkloadsModal] =
    useState(false);

  const [loading, setLoading] = useState(true);

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
        flexDirection={screenSize.isMobile ? 'column' : 'row'}
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
            width: screenSize.isMobile ? 300 : 400,
            my: screenSize.isSmallTablet || screenSize.isMobile ? 2 : 0,
            position: 'relative',
          }}
        />
        {lib.firebase.auth.isManager(role) && (
          <Box display="flex" gap={1.5}>
            <Tooltip title="Edit Institution">
              <IconButton
                sx={{
                  m: 0,
                  p: 0.5,
                  backgroundColor: theme.palette.background.light,
                  borderRadius: 1,
                }}
                onClick={() => setOpenEditInstitutionModal(true)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Import Workloads">
              <IconButton
                sx={{
                  m: 0,
                  p: 0.5,
                  backgroundColor: theme.palette.background.light,
                  borderRadius: 1,
                }}
                onClick={() => setOpenImportWorkloadsModal(true)}
              >
                <FileDownload fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
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

      {selectedInstitution && (
        <EditInstitutionModal
          institution={selectedInstitution}
          open={openEditInstitutionModal}
          onClose={() => setOpenEditInstitutionModal(false)}
        />
      )}

      {selectedInstitution && (
        <ImportWorkloadsModal
          open={openImportWorkloadsModal}
          setOpen={setOpenImportWorkloadsModal}
          importWorkloads={async (workloads: ImportWorkload[]) => {
            try {
              await TrainingController.getInstance().importWorkloads(workloads);
              toast.success('Workloads imported successfully');
            } catch (e) {
              console.error(e);
              toast.error(
                `Failed to import workloads: ${(e as Error).message}`
              );
            }
          }}
        />
      )}

      <DashboardEditAthleteModal
        open={openEditAthleteModal}
        setOpen={setOpenEditAthleteModal}
      />
    </Box>
  );
}
