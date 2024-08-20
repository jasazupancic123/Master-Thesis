'use client';

import withAuth from '@/hoc/with-auth';
import React, { useState } from 'react';
import { User } from '@/type/user.type';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { useFetch } from '@/hook/use-fetch';
import { useLocalStorage } from 'usehooks-ts';
import { FIREBASE_COOKIE_NAME } from '@/constant/cookies';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowEditStopReasons,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
} from '@mui/x-data-grid';
import { ALL_LEVELS, ALL_ROLES } from '@/constant/user';
import { UserRole } from '@/enum/user-role.enum';
import MyModal from '@/component/modal';
import Typography from '@mui/material/Typography';
import toast from 'react-hot-toast';
import { CustomClaims } from '@/type/custom-claims.type';
import { FitcodeApi } from '@/util/api';

function Page() {
  const [users, loading, _, __, setUsers] = useFetch(FitcodeApi.URL.users());
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [token] = useLocalStorage(FIREBASE_COOKIE_NAME, '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleted, setDeleted] = useState('' as string);

  async function updateUserClaims(uid: string, claims: CustomClaims) {
    try {
      await FitcodeApi.updateUserClaims(uid, token, claims);
      toast.success('Successfully updated user role');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteUser(uid: string) {
    try {
      await FitcodeApi.deleteUser(uid, token);
      toast.success('Successfully deleted user');
      setUsers(users.filter((user) => user.uid !== uid));
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <h2>Loading...</h2>;

  const columns: GridColDef<User[number]>[] = [
    { field: 'uid', headerName: 'ID', width: 280 },
    { field: 'email', headerName: 'E-mail', width: 250 },
    {
      field: 'emailVerified',
      headerName: 'Verified',
      width: 80,
      renderCell: ({ value }) => value ? '✅' : '❌',
    },
    { field: 'displayName', headerName: 'Name', width: 150 },
    {
      field: 'role',
      valueGetter: (_, row) => row.customClaims?.role?.[0],
      valueSetter: (newValue, row) => {
        row.customClaims = { ...row.customClaims, role: [newValue] };
        return row;
      },
      headerName: 'Role',
      width: 100,
      editable: true,
      type: 'singleSelect',
      valueOptions: ALL_ROLES,
    },
    {
      field: 'level',
      valueGetter: (_, row) => row.customClaims?.level,
      valueSetter: (newValue, row) => {
        row.customClaims = { ...row.customClaims, level: newValue };
        return row;
      },
      headerName: 'Level',
      width: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: ALL_LEVELS,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode)
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{ color: 'primary.main' }}
              onClick={() => {
                setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
              }}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={() => {
                setRowModesModel({
                  ...rowModesModel,
                  [id]: { mode: GridRowModes.View, ignoreModifications: true },
                });
              }}
              color="inherit"
            />,
          ];

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleted(id as string);
            }}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <>
      <Box height={20} />

      <Box sx={{
        height: 500,
        width: '100%',
        '& .actions': { color: 'text.secondary' },
        '& .textPrimary': { color: 'text.primary' },
      }}>
        <DataGrid
          getRowId={(row) => row.uid}
          rows={users}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newRowModesModel: GridRowModesModel) =>
            setRowModesModel(newRowModesModel)
          }
          onRowEditStop={(params, event) => {
            if (params.reason === GridRowEditStopReasons.rowFocusOut)
              event.defaultMuiPrevented = true;
          }}
          processRowUpdate={async (newRow: GridRowModel) => {
            const updatedRow = { ...newRow, isNew: false };
            const userId = updatedRow.uid;

            setUsers(users.map((user) => (user.uid === userId ? updatedRow : user)));
            await updateUserClaims(userId, updatedRow.customClaims);
            return updatedRow;
          }}
        />
      </Box>

      {/* Delete Modal */}
      <MyModal
        isOpen={showDeleteModal}
        setIsOpen={setShowDeleteModal}
        actions={<>
          <Button
            onClick={async () => {
              await deleteUser(deleted);
              setShowDeleteModal(false);
            }}
            color="primary">
            Delete
          </Button>
          <Button onClick={() => setShowDeleteModal(false)} color="secondary">Cancel</Button>
        </>}
      >
        <Typography>Are you sure you want to delete this user?</Typography>
      </MyModal>
    </>
  );
}

export default withAuth(Page, [UserRole.ADMIN]);