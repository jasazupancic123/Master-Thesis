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
import PageTitle from '../../../../components/page-title';
import { User } from '@/controller/user/type/user.type';
import { AddMembersModal } from '@/components/add-members-modal';
import MyModal from '@/components/modal';
import { SearchBar } from '@/components/search-bar';
import { filterMembers, handleCreateGroup, handleRemoveMember } from './state';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { GroupIdPageProps } from '../type';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import { useScreenSize } from '@/context/screen-size-provider';

export default function AddGroupPage(props: GroupIdPageProps) {
  const screenSize = useScreenSize();
  const { token, users, groups, group } = props;
  const theme = useTheme();

  const [members, setMembers] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchQueryMembers, setSearchQueryMembers] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);

  useEffect(() => {
    if (!members) return;
    filterMembers(members, setFilteredMembers, searchQueryMembers);
  }, [searchQueryMembers, members]);

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
            handleRemoveMember(
              params.row as User,
              members,
              setMembers,
              setFilteredMembers
            )
          }
        />
      ),
    },
  ];

  return (
    <>
      <Box mt="16px">
        <TrainerGroupSidebar
          groups={groups}
          selectedGroup={group}
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
        bgcolor={theme.palette.background.paper}
        borderRadius={5}
        pb={2}
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
          flexDirection={screenSize.isMobile ? 'column' : 'row'}
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
