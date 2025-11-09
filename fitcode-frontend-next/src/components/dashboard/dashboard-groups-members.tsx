import { PersonAdd, Remove } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

import { useDashboardUserEdit } from './context/user-edit.context';
import DashboardEditAthleteModal from './modals/dashboard-edit-athlete-modal';
import { AddMembersModal } from '@/components/dashboard/modals/add-members-modal';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { SearchBar } from '@/ui/search-bar/search-bar';
import { Group } from '@/core/group/type/group.type';
import AthleteOptionsContainer from '../athlete/athlete-options-container';
import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { AuthUser } from '@/core/auth/type/user.type';

interface Props {
  group: Group | null;
}

export default function DashboardGroupsMembers(props: Props) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { users } = useMain();
  const { role } = useAuthenticatedAuth();
  const { selectedInstitution, removeGroupMember } = useDashboard();
  const { setFilteredUsers, hoveredUser, toggleUser, onHoverUser } =
    useDashboardUserEdit();

  const { group } = props;

  const [filteredMembers, setFilteredMembers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);

  useEffect(() => {
    if (!group || !group.members) {
      setFilteredMembers([]);
      return;
    }

    if (!search) {
      setFilteredMembers(group.members);
      return;
    }

    const filtered = (group.members || []).filter((user) => {
      if (!user.displayName) return false;
      return user.displayName.toLowerCase().includes(search.toLowerCase());
    });

    setFilteredMembers(filtered);
  }, [group, search]);

  useEffect(() => {
    setSearch('');
  }, [group]);

  const owner = users.find((u) => u.uid === group?.ownerId);
  const ownerNames = owner?.displayName ? owner.displayName.split(' ') : [];

  return (
    <Box
      width="100%"
      maxWidth={MAX_WIDTH}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Box
        width="100%"
        display="flex"
        gap={1}
        justifyContent="center"
        alignItems="center"
      >
        <SearchBar
          placeholder={'Search members'}
          value={search}
          handleSearchChange={(e) => {
            if (!group) return;
            const filtered = (group.members || []).filter((user) => {
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
        {role &&
          (lib.firebase.auth.isTrainer(role) ||
            lib.firebase.auth.isManager(role)) && (
            <IconButton
              onClick={() => setOpenAddMemberModal(true)}
              sx={{ p: 0, m: 0 }}
            >
              <PersonAdd />
            </IconButton>
          )}
      </Box>

      <Box width="100%" display="flex" flexDirection="column">
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
          {!group ? (
            <Typography>No groups yet</Typography>
          ) : (
            <>
              <Box
                key={owner?.uid}
                display="flex"
                flexDirection="column"
                gap={1}
                sx={{ position: 'relative' }}
              >
                <Avatar
                  className="avatar-border"
                  src={
                    users.find((m) => m.uid === group?.ownerId)?.photoURL ||
                    USER_AVATAR_IMG_URL
                  }
                  sx={{
                    width: screenSize.isMobile ? 70 : 80,
                    height: screenSize.isMobile ? 70 : 80,
                  }}
                  onClick={() => {
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
                  {ownerNames.length > 1 ? (
                    <>
                      {ownerNames[0]}
                      <br />
                      {ownerNames[1].toUpperCase()}
                    </>
                  ) : (
                    <>{(owner?.displayName || '').toUpperCase()}</>
                  )}
                </Typography>
                <Typography
                  fontWeight={600}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 10,
                    color: theme.palette.background.default,
                  }}
                >
                  T
                </Typography>
              </Box>
              {(filteredMembers || []).map((user) => {
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
                          onClick={async (e) => {
                            e.stopPropagation();
                            await removeGroupMember(user.uid, group.id);
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
            </>
          )}
        </Box>
      </Box>

      <AddMembersModal
        users={selectedInstitution?.athletes || []}
        group={group}
        enableFirstShowUsers
        enableScroll
        open={openAddMemberModal}
        setOpen={setOpenAddMemberModal}
      />

      <DashboardEditAthleteModal
        open={openEditAthleteModal}
        setOpen={setOpenEditAthleteModal}
      />
    </Box>
  );
}
