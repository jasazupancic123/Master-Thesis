'use client';

import GroupSidebar from '@/components/group-sidebar';
import { GroupService } from '@/controller/group/group.service';
import { User } from '@/controller/user/type/user.type';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Avatar, Box, Button, Grid2, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { AddMembersModal } from '../../../../components/add-members-modal';
import MyModal from '../../../../components/modal';
import PageTitle from '../../../../components/page-title';
import { SearchBar } from '../../../../components/search-bar';
import { GroupIdPageProps } from '../props';
import {
  handleMembersSearchChange,
  handleRemoveMember,
  handleUpdateMembers,
} from './state';

export default function MembersPage(props: GroupIdPageProps) {
  const { token, group, users, groups, exercises, attributes, components } =
    props;

  const theme = useTheme();
  const [selectedGroup, setSelectedGroup] = useState(() => group);

  const [members, setMembers] = useState<User[]>(() =>
    GroupService.mapMembers(selectedGroup, users)
  );

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchQueryMembers, setSearchQueryMembers] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<User[]>();

  useEffect(() => {
    const filtered = members.filter(
      (member) =>
        member.displayName?.toLowerCase().includes(searchQueryMembers) ||
        member.email.toLowerCase().includes(searchQueryMembers)
    );

    setFilteredMembers(filtered);
  }, [searchQueryMembers, members]);

  return (
    <>
      <Box mt="16px">
        <GroupSidebar
          groups={groups}
          selectedGroup={selectedGroup}
          logout={async () => {
            console.log('Log out');
          }}
        />
      </Box>

      <Box
        bgcolor={theme.palette.background.default}
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        mt={0}
      >
        <PageTitle title={`Members of ${selectedGroup.name}`} />

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
              maxWidth="60%"
              placeholder="Search Members"
              value={searchQueryMembers}
              handleSearchChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleMembersSearchChange(e, setSearchQueryMembers)
              }
            />

            {/* Add User Button */}
            <Button
              variant="contained"
              onClick={() => setShowAddUserModal(true)}
              color="primary"
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
              Add Member
            </Button>
          </Box>
        </Box>

        {/* Table Container */}
        <Box width="75%">
          {/* Table Header (Legend) */}
          <Grid2
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
            <Grid2
              sx={{ minWidth: 40, flex: '0 0 5%' }}
              display="flex"
              justifyContent="center"
            ></Grid2>
            <Grid2
              sx={{ minWidth: 30, flex: '0 0 3%' }}
              display="flex"
              justifyContent="center"
            ></Grid2>
            <Grid2
              sx={{ minWidth: 120, flex: '1 1 25%' }}
              display="flex"
              justifyContent="center"
            >
              <Typography variant="body1" fontWeight="bold">
                Name
              </Typography>
            </Grid2>
            <Grid2
              sx={{ minWidth: 120, flex: '1 1 25%' }}
              display="flex"
              justifyContent="center"
            >
              <Typography variant="body1" fontWeight="bold">
                Email
              </Typography>
            </Grid2>
            <Grid2
              sx={{ minWidth: 100, flex: '1 1 20%' }}
              display="flex"
              justifyContent="center"
            >
              <Typography variant="body1" fontWeight="bold">
                Verified
              </Typography>
            </Grid2>
            <Grid2
              sx={{ minWidth: 80, flex: '1 1 15%' }}
              display="flex"
              justifyContent="center"
            >
              <Typography variant="body1" fontWeight="bold">
                Remove
              </Typography>
            </Grid2>
          </Grid2>

          {/* Filtered Members List */}
          <Box maxHeight="45vh" overflow="auto">
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
                    sx={{ minWidth: 40, flex: '0 0 5%' }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Typography variant="body1">{index + 1}.</Typography>
                  </Grid2>

                  {/* Avatar */}
                  <Grid2
                    sx={{ minWidth: 30, flex: '0 0 3%' }}
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
                    sx={{ minWidth: 120, flex: '1 1 25%' }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Typography variant="body1">
                      {member.displayName || 'Unknown User'}
                    </Typography>
                  </Grid2>

                  {/* User Email */}
                  <Grid2
                    sx={{ minWidth: 120, flex: '1 1 25%' }}
                    display="flex"
                    justifyContent="center"
                  >
                    <Typography variant="body2">{member.email}</Typography>
                  </Grid2>

                  {/* Email Verified Indicator */}
                  <Grid2
                    sx={{ minWidth: 100, flex: '1 1 20%' }}
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
                    sx={{ minWidth: 80, flex: '1 1 15%' }}
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
                No members found.
              </Typography>
            )}
          </Box>
        </Box>

        <Button
          variant="contained"
          sx={{ marginTop: 2, backgroundColor: theme.palette.primary.dark }}
          onClick={() =>
            handleUpdateMembers(token, members, selectedGroup, setSelectedGroup)
          }
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
            members={members || []}
            setMembers={setMembers}
            addUserToEnd={false}
          />
        </MyModal>
      </Box>
    </>
  );
}
