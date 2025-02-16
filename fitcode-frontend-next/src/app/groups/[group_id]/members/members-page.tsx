'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, Avatar, Grid2, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import PageTitle from '../../../../components/page-title';
import { GroupIdPageProps } from '../type';
import { GroupService } from '@/controller/group/group.service';
import { User } from '@/controller/user/type/user.type';
import { SearchBar } from '../../../../components/search-bar';
import MyModal from '../../../../components/modal';
import { AddMembersModal } from '../../../../components/add-members-modal';
import {
  handleMembersSearchChange,
  handleRemoveMember,
  handleUpdateMembers,
} from './state';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { useScreenSize } from '@/context/screen-size-provider';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';

export default function MembersPage(props: GroupIdPageProps) {
  const screenSize = useScreenSize();
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
          onClick={() => handleRemoveMember(params.row)}
        />
      ),
    },
  ];

  const handleRemoveMember = (member: User) => {
    setMembers((prev) => prev.filter((m) => m.uid !== member.uid));
  };

  return (
    <>
      <Box mt="16px">
        <TrainerGroupSidebar
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
            width="100%"
            display="flex"
            flexDirection={screenSize.isMobile ? 'column' : 'row'}
            justifyContent="center"
            alignItems="center"
            gap={2}
            py={1}
          >
            {/* Search Bar */}
            <SearchBar
              maxWidth={screenSize.isMobile ? '90%' : '60%'}
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
