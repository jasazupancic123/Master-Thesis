import { Add, Remove } from '@mui/icons-material';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';

import { handleRemoveAthleteFromGroup } from './actions/actions-users';
import useDashboardGroupsMembersUsers from './hooks/use-users';
import useDashboardGroupsMembersUtils from './hooks/use-utils';
import DashboardEditAthleteModal from './modals/dashboard-edit-athlete-modal/dashboard-edit-athlete-modal';
import { AddMembersModal } from '@/components/dashboard/modals/add-members-modal';
import { GroupController } from '@/core/group/group.controller';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import CustomDivider from '@/util/custom-divider/custom-divider';
import { SearchBar } from '@/util/search-bar/search-bar';

export default function DashboardGroupsMembers() {
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const { users } = useMain();

  const { role } = useAuthenticatedAuth();

  const dashboardContext = useDashboard();
  const usersContext = useDashboardGroupsMembersUsers();

  const { selectedInstitution, setSelectedInstitution, selectedGroup } =
    dashboardContext;

  const {
    filteredUsers,
    setFilteredUsers,
    hoveredUser,
    setHoveredUser,
    editUser,
    setEditUser,
    search,
    setSearch,
  } = usersContext;

  const {
    openEditAthleteModal,
    setOpenEditAthleteModal,
    openAddMemberModal,
    setOpenAddMemberModal,
  } = useDashboardGroupsMembersUtils();

  const controller = GroupController.getInstance();

  return (
    <>
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
            width: screenSize.isSmallerThanLaptop
              ? '50% !important'
              : '33% !important',
            my: screenSize.isSmallTablet || screenSize.isMobile ? 2 : 0,
            position: 'relative',
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
                    sx={{
                      position: 'relative',
                    }}
                    onMouseEnter={() => setHoveredUser(user)}
                    onMouseLeave={() => setHoveredUser(null)}
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
                            handleRemoveAthleteFromGroup(
                              { userId: user.uid, controller, router },
                              {
                                useDashboard: dashboardContext,
                                useDashboardGroupsMembersUsers: usersContext,
                              }
                            );
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
                        setEditUser(user);
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
                      sx={{
                        width: screenSize.isMobile ? 70 : 80,
                        height: screenSize.isMobile ? 70 : 80,
                        //p: 3.5,
                        m: 0,
                        backgroundColor: theme.palette.background.light,
                      }}
                      onClick={() => {
                        setOpenAddMemberModal(true);
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
        editUser={editUser}
        setEditUser={setEditUser}
        setFilteredUsers={setFilteredUsers}
      />
    </>
  );
}
