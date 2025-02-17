'use client';

import { AddMembersModal } from '@/components/add-members-modal';
import GroupSidebar from '@/components/group-sidebar';
import MyModal from '@/components/modal';
import PageTitle from '@/components/page-title';
import { SearchBar } from '@/components/search-bar';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { GroupService } from '@/controller/group/group.service';
import { User } from '@/controller/user/type/user.type';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Avatar, Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { handleRemoveMember, handleUpdateMembers } from './state';

export default function GroupMembersPage() {
  const { token, group, setGroup, users, groups } = useGroup();

  const router = useRouter();
  const theme = useTheme();
  const screenSize = useScreenSize();

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchQueryMembers, setSearchQueryMembers] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<User[]>();
  const [members, setMembers] = useState<User[]>(() =>
    GroupService.mapMembers(group, users)
  );

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
    <Box display="flex" bgcolor={theme.palette.background.default}>
      <Box mt="16px">
        <GroupSidebar groups={groups} group={group} />
      </Box>

      <Box
        bgcolor={theme.palette.background.paper}
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        mt={2}
        borderRadius={5}
        pb={2}
      >
        <PageTitle title={`Members of ${group.name}`} />

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
              handleSearchChange={(e) =>
                setSearchQueryMembers(e.target.value.toLowerCase())
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
          sx={{
            marginTop: 2,
            backgroundColor: theme.palette.primary.dark,
          }}
          onClick={() =>
            handleUpdateMembers(token, members, { router, group, setGroup })
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
    </Box>
  );
}
