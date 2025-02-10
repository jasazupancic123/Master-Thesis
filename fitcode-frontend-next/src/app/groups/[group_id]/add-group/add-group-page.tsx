'use client';

import { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Grid2,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { useTheme } from '@mui/material/styles';
import PageTitle from '../../components/page-title';
import { User } from '@/controller/user/type/user.type';
import { AddMembersModal } from '@/components/add-members-modal';
import MyModal from '@/components/modal';
import { SearchBar } from '@/components/search-bar';
import { filterMembers, handleCreateGroup, handleRemoveMember } from './state';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { GroupIdPageProps } from '../type';

export default function AddGroupPage(props: GroupIdPageProps) {
  const { token, users, groups, groupId } = props;
  const theme = useTheme();

  const selectedGroup = groups.find((g) => g.id === groupId)!;

  const [members, setMembers] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchQueryMembers, setSearchQueryMembers] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);

  useEffect(() => {
    if (!members) return;
    filterMembers(members, setFilteredMembers, searchQueryMembers);
  }, [searchQueryMembers, members]);

  return (
    <>
      <Box mt="16px" ml="45px">
        <TrainerGroupSidebar
          groups={groups}
          selectedGroup={selectedGroup}
          logout={async () => {
            console.log('Log out');
          }}
        />
      </Box>
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
            handleSearchChange={(e) =>
              setSearchQueryMembers(e.target.value.toLowerCase())
            }
            maxWidth="60%"
          />

          {/* Add User Button */}
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
            onClick={() => setShowAddUserModal(true)}
          >
            Add Member
          </Button>
        </Box>

        {/* Table Container */}
        <Box width="75%">
          {/* Table Header (Legend) */}
          <Grid2
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
            <Grid2
              size={{ xs: 1 }}
              display="flex"
              justifyContent="center"
            ></Grid2>
            <Grid2
              size={{ xs: 0.5 }}
              display="flex"
              justifyContent="center"
            ></Grid2>
            <Grid2 size={{ xs: 3 }} display="flex" justifyContent="center">
              <Typography variant="body1" fontWeight="bold">
                Name
              </Typography>
            </Grid2>
            <Grid2 size={{ xs: 3 }} display="flex" justifyContent="center">
              <Typography variant="body1" fontWeight="bold">
                Email
              </Typography>
            </Grid2>
            <Grid2 size={{ xs: 2.5 }} display="flex" justifyContent="center">
              <Typography variant="body1" fontWeight="bold">
                Verified
              </Typography>
            </Grid2>
            <Grid2 size={{ xs: 2 }} display="flex" justifyContent="center">
              <Typography variant="body1" fontWeight="bold">
                Remove
              </Typography>
            </Grid2>
          </Grid2>

          <Box maxHeight="42vh" overflow="auto">
            {/* Filtered Members List */}
            {filteredMembers && filteredMembers.length > 0 ? (
              filteredMembers.map((member, index) => (
                <Grid2
                  container
                  key={member.uid}
                  alignItems="center"
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    paddingY: 1,
                  }}
                >
                  {/* Index */}
                  <Grid2
                    size={{ xs: 1 }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Typography variant="body1">{index + 1}.</Typography>
                  </Grid2>
                  {/* Avatar */}
                  <Grid2
                    size={{ xs: 0.5 }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Avatar
                      src="/user_avatar.png"
                      alt={member.displayName || 'User Avatar'}
                    />
                  </Grid2>

                  {/* User Name */}
                  <Grid2
                    size={{ xs: 3 }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Typography variant="body1">
                      {member.displayName || 'Unknown User'}
                    </Typography>
                  </Grid2>

                  {/* User Email */}
                  <Grid2
                    size={{ xs: 3 }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Typography variant="body2">{member.email}</Typography>
                  </Grid2>

                  {/* Email Verified Indicator */}
                  <Grid2
                    size={{ xs: 2.5 }}
                    display="flex"
                    justifyContent="center"
                  >
                    {member.emailVerified ? (
                      <CheckCircleIcon
                        sx={{ color: theme.palette.success.main, fontSize: 24 }}
                      />
                    ) : (
                      <CancelIcon
                        sx={{ color: theme.palette.error.main, fontSize: 24 }}
                      />
                    )}
                  </Grid2>

                  {/* Remove Button */}
                  <Grid2
                    size={{ xs: 2 }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Button
                      variant="contained"
                      color="error"
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: theme.palette.error.dark,
                        },
                      }}
                      onClick={() =>
                        handleRemoveMember(
                          member,
                          members,
                          setMembers,
                          setFilteredMembers
                        )
                      }
                    >
                      <RemoveCircleIcon />
                    </Button>
                  </Grid2>
                </Grid2>
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
            members={members || []}
            setMembers={setMembers}
            addUserToEnd={true}
          />
        </MyModal>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() =>
            handleCreateGroup(
              token,
              groupName,
              members,
              setMembers,
              setGroupName
            )
          }
        >
          Create Group
        </Button>
      </Box>
    </>
  );
}
