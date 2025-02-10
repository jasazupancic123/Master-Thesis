'use client';

import { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { useTheme } from '@mui/material/styles';
import { useAppContext } from '@/context/app-provider';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useGroupSidebar } from '@/context/groups-sidebar-provider';
import { useRouter } from 'next/navigation';
import { LINK_GROUPS } from '@/common/constant/navigation.constant';
import { LOCAL_STORAGE_KEYS } from '@/common/constant/local-storage.constant';
import PageTitle from '../components/page-title';
import { User } from '@/controller/user/type/user.type';
import { AddMembersModal } from '@/components/add-members-modal';
import MyModal from '@/components/modal';
import { SearchBar } from '@/components/search-bar';
import { GroupController } from '@/controller/group/group.controller';

export default function AddGroup() {
  const { users, setSelected } = useGroupSidebar();
  const { token } = useAppContext();
  const theme = useTheme();
  const router = useRouter();

  const [members, setMembers] = useState<User[] | undefined>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [groupName, setGroupName] = useState('');

  const [searchQueryMembers, setSearchQueryMembers] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<User[] | undefined>(
    []
  );

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

  const handleCreateGroup = async () => {
    if (!groupName || groupName.length === 0) {
      toast.error('Please enter a group name.');
      return;
    }
    if (!members || members.length === 0) {
      toast.error('Please add at least one member to the group.');
      return;
    }
    const membersIds = members.map((member) => member.uid);
    try {
      const newGroup = await GroupController.create(token, {
        name: groupName,
        membersIds,
      });
      if (newGroup) {
        toast.success('Group created successfully.');
        setMembers([]);
        setGroupName('');
        setSelected({
          cycle: null,
          subgroup: null,
          group: newGroup,
        });

        localStorage.setItem(
          LOCAL_STORAGE_KEYS.SELECTED_GROUP_ID,
          newGroup.id as string
        );
        router.push(LINK_GROUPS.href + '/' + newGroup.id);
      } else {
        toast.error('Failed to create group.');
      }
    } catch (error) {
      toast.error('Failed to create group.');
    }
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
      display="flex"
      flexDirection="column"
      alignItems="center"
      pl={3}
      pr={3}
      mt="15px"
      height="100%"
    >
      <PageTitle title="Create a New Group" />
      <TextField
        label="Group Name"
        sx={{ minWidth: 275, mt: 3 }}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <Typography variant="h5" gutterBottom mt={3} mb={0}>
        Members
      </Typography>
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

      {/* ✅ Table Container */}
      <Box width="75%">
        {/* ✅ Table Header (Legend) */}
        <Grid
          container
          sx={{
            borderBottom: `2px solid ${theme.palette.divider}`,
            pt: 1,
            pb: 1,
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

        <Box maxHeight="42vh" overflow="auto">
          {/* ✅ Filtered Members List */}
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
              No members added yet.
            </Typography>
          )}
        </Box>
      </Box>

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
          addUserToEnd={true}
        />
      </MyModal>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={() => handleCreateGroup()}
      >
        Create Group
      </Button>
    </Box>
  );
}
