import { Add, Remove } from '@mui/icons-material';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';

import { useDashboardUserEdit } from './context/user-edit.context';
import DashboardEditAthleteModal from './dashboard-edit-athlete-modal';
import useInstitutionMembers from './hooks/use-institution-members.hook';
import { AddMembersModal } from '@/components/dashboard/add-members-modal';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import CustomDivider from '@/ui/custom-divider';
import { SearchBar } from '@/ui/search-bar/search-bar';

export default function DashboardGroupsMembers() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { users } = useMain();
  const { role } = useAuthenticatedAuth();
  const { selectedInstitution, setSelectedInstitution, selectedGroup } =
    useDashboard();

  const {
    filteredUsers,
    setFilteredUsers,
    hoveredUser,
    toggleUser,
    onHoverUser,
  } = useDashboardUserEdit();

  const { removeAthleteFromGroup } = useInstitutionMembers();

  const [search, setSearch] = useState('');
  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);

  return (
    <>
      <Box
        width="100%"
        display="flex"
        gap={1}
        sx={{ justifyContent: 'center', alignItems: 'center' }}
      >
        <SearchBar
          placeholder={'Search members'}
          value={search}
          handleSearchChange={(e) => {
            if (!selectedGroup) return;
            const filtered = (selectedGroup.members || []).filter((user) => {
              if (!user.displayName) return false;
              return user.displayName
                .toLowerCase()
                .includes(e.target.value.toLowerCase());
            });

            setFilteredUsers(filtered);
            setSearch(e.target.value);
          }}
          sx={{
            my: screenSize.isSmallTablet || screenSize.isMobile ? 2 : 0,
            position: 'relative',
            width: screenSize.isSmallerThanLaptop
              ? '50% !important'
              : '33% !important',
          }}
        />
      </Box>

      <Box width="100%" display="flex" flexDirection="column">
        <CustomDivider />
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
          {!selectedGroup ? (
            <Typography>Select a group</Typography>
          ) : (
            <>
              {filteredUsers.map((user) => {
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
                    {role &&
                      (lib.firebase.auth.isManager(role) ||
                        lib.firebase.auth.isTrainer(role)) &&
                      user.uid === hoveredUser?.uid && (
                        <IconButton
                          className="remove-icon"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAthleteFromGroup(user.uid);
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
              })}
              {role &&
                (lib.firebase.auth.isTrainer(role) ||
                  lib.firebase.auth.isManager(role)) && (
                  <Tooltip title="Add member" placement="bottom">
                    <IconButton
                      onClick={() => setOpenAddMemberModal(true)}
                      sx={{
                        width: screenSize.isMobile ? 70 : 80,
                        height: screenSize.isMobile ? 70 : 80,
                        m: 0,
                        backgroundColor: theme.palette.background.light,
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                )}
            </>
          )}
        </Box>
      </Box>

      <AddMembersModal
        users={selectedInstitution?.athletes || []}
        members={filteredUsers}
        setMembers={setFilteredUsers}
        setSelectedInstitution={setSelectedInstitution}
        addUserToEnd={true}
        dashboardView={true}
        group={selectedGroup}
        selectedInstitution={selectedInstitution}
        enableFirstShowUsers
        enableScroll
        open={openAddMemberModal}
        setOpen={setOpenAddMemberModal}
      />

      <DashboardEditAthleteModal
        open={openEditAthleteModal}
        setOpen={setOpenEditAthleteModal}
      />
    </>
  );
}
