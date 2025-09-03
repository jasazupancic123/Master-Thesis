import { Add, Remove } from '@mui/icons-material';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { AddMembersModal } from '../add-members-modal/add-members-modal';
import DashboardEditAthleteModal from '../dashboard-edit-athlete-modal/dashboard-edit-athlete-modal';
import MyModal from '../modal/modal';
import { SearchBar } from '../search-bar/search-bar';
import { isManager, isTrainer } from '@/common/firebase/firebase-auth.util';
import { handleApiRequest, type SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import type { User } from '@/controller/user/type/user.type';
import { useAuth } from '@/store/auth-provider';
import { useDashboard } from '@/store/dashboard-provider';
import { useScreenSize } from '@/store/screen-size-provider';

interface DashboardGroupsMembersProps {
  modal: {
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    add_member_via_csv: boolean;
    edit_athlete: boolean;
  };
  setModal: SetState<{
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    add_member_via_csv: boolean;
    edit_athlete: boolean;
  }>;
}

export default function DashboardGroupsMembers(
  props: DashboardGroupsMembersProps
) {
  const router = useRouter();

  const { role } = useAuth();
  const {
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    members,
    setDetectedChanges,
  } = useDashboard();

  const theme = useTheme();
  const screenSize = useScreenSize();

  const { modal, setModal } = props;

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!selectedGroup) {
      setFilteredUsers([]);
      setSearch('');
      return;
    }

    setFilteredUsers(selectedGroup.members || []);
    setSearch('');
  }, [selectedGroup]);

  const handleRemoveAthleteFromGroup = async (userId: string) => {
    if (!selectedGroup) return;

    await handleApiRequest(
      router,
      () => GroupController.removeMember(selectedGroup!.id, { userId: userId }),
      () => {
        toast.success('Member removed successfully');
      },
      (e) => {
        toast.error((e as Error).message);
      }
    );

    setFilteredUsers((prev) => prev.filter((m) => m.uid !== userId));
    setSelectedInstitution((prev) => {
      if (!prev) return null;
      const updatedGroups = prev.groups.map((g) => {
        if (g.id === selectedGroup?.id) {
          return {
            ...g,
            members: g.members?.filter((m) => m.uid !== userId),
            membersIds: g.membersIds.filter((uid) => uid !== userId),
          };
        }
        return g;
      });
      return {
        ...prev,
        groups: updatedGroups,
      };
    });
    setDetectedChanges(true);
  };

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
                      (isManager(role) || isTrainer(role)) &&
                      user.uid === hoveredUser?.uid && (
                        <IconButton
                          className="remove-icon"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAthleteFromGroup(user.uid);
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
                        members.find((m) => m.id === user.uid)
                          ?.profileImageUrl || '/user_avatar.png'
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
              })}
              {role && (isTrainer(role) || isManager(role)) && (
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
                      setModal((prev) => ({ ...prev, add_member: true }));
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

      <MyModal
        isOpen={modal.add_member}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, add_member: open }))
        }
        onCancel={() => setModal((prev) => ({ ...prev, add_member: false }))}
        cancelText="Close"
      >
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
        />
      </MyModal>

      <DashboardEditAthleteModal
        isOpen={modal.edit_athlete}
        setModal={setModal}
        editUser={editUser}
        setEditUser={setEditUser}
      />
    </>
  );
}
