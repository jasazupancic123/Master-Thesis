'use client';

import withAuth from '@/common/components/with-auth';
import React, { useState } from 'react';
import { User } from '@/user/type/user.type';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { useFetch } from '@/hook/use-fetch';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowEditStopReasons,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
} from '@mui/x-data-grid';
import { ALL_LEVELS, ALL_ROLES } from '@/common/constant/user.constant';
import { UserRole } from '@/user/enum/user-role.enum';
import toast from 'react-hot-toast';
import { CustomClaims } from '@/user/type/custom-claims.type';
import { UserController } from '@/user/user.controller';

function Page() {
  const users = useFetch<User[]>(UserController.URL.users());
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  async function updateUserClaims(uid: string, claims: Partial<CustomClaims>) {
    try {
      await UserController.updateUserClaims(uid, claims);
      toast.success('Successfully updated user role');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (users.loading) return <h2>Loading...</h2>;

  const columns: GridColDef<User>[] = [
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
              key={0}
              icon={<SaveIcon />}
              label="Save"
              sx={{ color: 'primary.main' }}
              onClick={() => {
                setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
              }}
            />,
            <GridActionsCellItem
              key={1}
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
            key={0}
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })}
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
          rows={users.data || []}
          columns={columns as GridColDef[]}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newRowModesModel: GridRowModesModel) =>
            setRowModesModel(newRowModesModel)
          }
          onRowEditStop={(params, event) => {
            if (params.reason === GridRowEditStopReasons.rowFocusOut)
              event.defaultMuiPrevented = true;
          }}
          processRowUpdate={async (newRow: GridRowModel<User>) => {
            const updatedRow = { ...newRow, isNew: false };
            const userId = updatedRow.uid;

            users.setData((users.data || []).map((user) => (user.uid === userId ? updatedRow : user)));
            await updateUserClaims(userId, updatedRow.customClaims);
            return updatedRow;
          }}
        />
      </Box>
    </>
  );
}

export default withAuth(Page, [UserRole.ADMIN]);