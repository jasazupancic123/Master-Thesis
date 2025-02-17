'use client';

import { AddMembersModal } from '@/components/add-members-modal';
import GroupSidebar from '@/components/group-sidebar';
import MyModal from '@/components/modal';
import PageTitle from '@/components/page-title';
import { SearchBar } from '@/components/search-bar';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { User } from '@/controller/user/type/user.type';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import {
  Avatar,
  Box,
  Button,
  Grid2,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  handleCreateGroup,
  handleFilterMembers,
  handleRemoveMember,
} from './state';

export default function AddGroupPage() {
  const { token, users, groups, group } = useGroup();
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const [members, setMembers] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    handleFilterMembers({ members, setFilteredMembers, search });
  }, [search, members]);

  const columns: GridColDef<User>[] = [
    {
      field: 'index',
      headerName: '#',
      width: 10,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    {
      field: 'avatar',
      headerName: '',
      width: 10,
      type: 'actions',
      renderCell: () => <Avatar src="/user_avatar.png" />,
    },
    {
      field: 'displayName',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'emailVerified',
      headerName: 'Verified',
      type: 'actions',
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <CheckCircleIcon color="success" />
        ) : (
          <CancelIcon color="error" />
        ),
    },
    {
      field: 'delete',
      headerName: 'Delete',
      type: 'actions',
      width: 100,
      renderCell: (params) => (
        <GridActionsCellItem
          icon={<RemoveCircleIcon color="error" />}
          label="Remove"
          onClick={() =>
            handleRemoveMember({
              user: params.row,
              members,
              setMembers,
              setFilteredMembers,
            })
          }
        />
      ),
    },
  ];

  return (
    <>
      <GroupSidebar groups={groups} group={group} />

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        pl={3}
        pr={3}
        mt="15px"
        height="100%"
        bgcolor={theme.palette.background.paper}
        borderRadius={5}
        pb={2}
      >
        <PageTitle title="Create a New Group" />

        <TextField
          label="Group Name"
          sx={{ minWidth: 275, mt: 3 }}
          onChange={(e) => setName(e.target.value)}
        />

        <Typography variant="h5" gutterBottom mt={3} mb={0}>
          Members
        </Typography>

        <Box
          display="flex"
          flexDirection={screenSize.isMobile ? 'column' : 'row'}
          justifyContent="center"
          alignItems="center"
          gap={2}
          p={2}
        >
          {/* Search Bar */}
          <SearchBar
            placeholder="Search Members"
            value={search}
            handleSearchChange={(e) => setSearch(e.target.value.toLowerCase())}
            maxWidth={screenSize.isMobile ? '100%' : '60%'}
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
        <Box width={screenSize.isMobile ? '95%' : '75%'}>
          <DataGrid
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: screenSize.isMobile ? 5 : 10,
                },
              },
            }}
            rows={filteredMembers}
            columns={columns}
            getRowId={(row) => row.uid}
          />
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
              { name, membersIds: members.map((m) => m.uid) },
              { router, setMembers }
            )
          }
        >
          Create Group
        </Button>
      </Box>
    </>
  );
}
