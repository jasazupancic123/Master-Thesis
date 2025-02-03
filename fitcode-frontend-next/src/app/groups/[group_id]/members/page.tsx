'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFetch } from '@/hook/use-fetch';
import { Group } from '@/group/entity/group.entity';
import { Typography, Box, Avatar, Grid, Button } from '@mui/material';
import { User } from '@/user/type/user.type';
import { GroupController } from '@/group/group.controller';
import { useAppContext } from '@/context/app-provider';
import { useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { SearchBar } from '@/common/components/search-bar';
import { useAuth } from '@/context/auth-provider';
import { UserController } from '@/user/user.controller';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import MyModal from '@/common/components/modal';
import { AddMembersModal } from '@/group/components/add-members';
import toast from 'react-hot-toast';
import { useGroupSidebar } from '@/context/groups-sidebar-provider';
import { UserRole } from '@/user/enum/user-role.enum';
import { SportLevel } from '@/user/enum/sport-level.enum';
import PageTitle from '../../components/page-title';

export default function Members() {
  const { users, selected, setSelected } = useGroupSidebar();
  const { token } = useAppContext();
  const theme = useTheme();
  const groupId = useParams().group_id as string;
  const [group, setGroup] = useState<Group | undefined | null>(selected.group);
  const [members, setMembers] = useState<User[] | undefined>(
    group?.members && group.members.length > 0
      ? group.members
      : [
          {
            uid: 'pdYsnmnhyxAcR6nlHcwBbdYWPrLL',
            email: 'janja.garnbret@mail.com',
            customClaims: {
              role: [UserRole.ATHLETE],
              level: SportLevel.BEGINNER,
            },
            displayName: 'Janja Garnbret',
            emailVerified: false,
          },
        ]
  ); //THIS IS DUMMY VALUE, REMOVE THIS WHEN BACKEND MEMBERS ON EACH GROUP FETCHING IS FIXED
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [searchQueryMembers, setSearchQueryMembers] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<User[] | undefined>();

  const handleMembersSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = event.target.value.toLowerCase();
    setSearchQueryMembers(query);
  };

  const handleRemoveMember = (user: User) => {
    if (!members) return;
    const updatedMembers = members.filter((m) => m.uid !== user.uid);
    setMembers(updatedMembers);
    setFilteredMembers(updatedMembers);
  };

  const handleUpdateMembers = async () => {
    if (!members || !group) return;
    const ids = members.map((member) => member.uid);
    console.log(ids);
    console.log(group.membersIds);
    if (
      ids.length === group.membersIds.length &&
      ids.every((id) => group.membersIds.includes(id))
    ) {
      toast.error('No changes detected.');
      return;
    }
    const membersIds = members.map((member) => member.uid);
    const newGroup = await GroupController.updateGroup(token, groupId, {
      ...group,
      membersIds,
    });
    //setGroup(newGroup);
    setSelected({ ...selected, group: newGroup });
    toast.success('Members updated successfully');
  };

  useEffect(() => {
    if (!members) return;
    const filtered = members.filter(
      (member) =>
        member.displayName?.toLowerCase().includes(searchQueryMembers) ||
        member.email.toLowerCase().includes(searchQueryMembers)
    );
    setFilteredMembers(filtered);
  }, [searchQueryMembers, members]);

  return (
    <Box
      bgcolor={theme.palette.background.default}
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      mt={0}
    >
      <PageTitle title={`Members of ${group?.name || ''}`} />

      {/* ✅ Search Members */}
      <Box
        display="flex"
        flexDirection="column"
        width="60%"
        p={2}
        alignItems="center"
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={2}
          p={2}
        >
          {/* Search Bar */}
          <SearchBar
            placeholder="Search Members"
            value={searchQueryMembers}
            handleSearchChange={handleMembersSearchChange}
            maxWidth="60%"
          />

          {/* Add User Button */}
          <Button
            variant="contained"
            color="primary"
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
            }}
            onClick={() => setShowAddUserModal(true)}
          >
            + Add Member
          </Button>
        </Box>
      </Box>

      {/* ✅ Table Container */}
      <Box width="75%">
        {/* ✅ Table Header (Legend) */}
        <Grid
          container
          sx={{
            pt: 1,
            pb: 1,
            borderBottom: `2px solid ${theme.palette.divider}`,
            fontWeight: 'bold',
            backgroundColor: theme.palette.background.paper,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
        >
          <Grid item xs={1} display="flex" justifyContent="center"></Grid>
          <Grid item xs={0.5} display="flex" justifyContent="center"></Grid>
          <Grid item xs={3} display="flex" justifyContent="center">
            <Typography variant="body1" fontWeight="bold">
              Name
            </Typography>
          </Grid>
          <Grid item xs={3} display="flex" justifyContent="center">
            <Typography variant="body1" fontWeight="bold">
              Email
            </Typography>
          </Grid>
          <Grid item xs={2.5} display="flex" justifyContent="center">
            <Typography variant="body1" fontWeight="bold">
              Verified
            </Typography>
          </Grid>
          <Grid item xs={2} display="flex" justifyContent="center">
            <Typography variant="body1" fontWeight="bold">
              Remove
            </Typography>
          </Grid>
        </Grid>

        {/* ✅ Filtered Members List */}
        <Box maxHeight="45vh" overflow="auto">
          {filteredMembers && filteredMembers.length > 0 ? (
            filteredMembers.map((member, index) => (
              <Grid
                container
                key={member.uid}
                alignItems="center"
                sx={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  paddingY: 1,
                }}
              >
                {/* Index */}
                <Grid item xs={1} display="flex" justifyContent="center">
                  <Typography variant="body1">{index + 1}.</Typography>
                </Grid>
                {/* Avatar */}
                <Grid item xs={0.5} display="flex" justifyContent="center">
                  <Avatar
                    src="/user_avatar.png"
                    alt={member.displayName || 'User Avatar'}
                  />
                </Grid>

                {/* User Name */}
                <Grid item xs={3} display="flex" justifyContent="center">
                  <Typography variant="body1">
                    {member.displayName || 'Unknown User'}
                  </Typography>
                </Grid>

                {/* User Email */}
                <Grid item xs={3} display="flex" justifyContent="center">
                  <Typography variant="body2">{member.email}</Typography>
                </Grid>

                {/* Email Verified Indicator */}
                <Grid item xs={2.5} display="flex" justifyContent="center">
                  {member.emailVerified ? (
                    <CheckCircleIcon
                      sx={{ color: theme.palette.success.main, fontSize: 24 }}
                    />
                  ) : (
                    <CancelIcon
                      sx={{ color: theme.palette.error.main, fontSize: 24 }}
                    />
                  )}
                </Grid>

                {/* Remove Button */}
                <Grid item xs={2} display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    color="error"
                    sx={{
                      color: 'white',
                      '&:hover': { backgroundColor: theme.palette.error.dark },
                    }}
                    onClick={() => handleRemoveMember(member)}
                  >
                    <RemoveCircleIcon />
                  </Button>
                </Grid>
              </Grid>
            ))
          ) : (
            <Typography textAlign="center" p={2}>
              No members found.
            </Typography>
          )}
        </Box>
      </Box>

      <Button
        variant="contained"
        sx={{ marginTop: 2, backgroundColor: theme.palette.primary.dark }}
        onClick={handleUpdateMembers}
      >
        Save Changes
      </Button>

      {/* Members modal */}
      <MyModal
        isOpen={showAddUserModal}
        setIsOpen={(open) => setShowAddUserModal(open)}
        onCancel={() => setShowAddUserModal(false)}
        cancelText="Close"
      >
        <AddMembersModal
          users={users}
          groupMembers={members || []}
          setGlobalMembers={setMembers}
          addUserToEnd={false}
        />
      </MyModal>
    </Box>
  );
}
